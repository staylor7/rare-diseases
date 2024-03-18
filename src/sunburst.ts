/**
 * Based off of https://observablehq.com/@d3/zoomable-sunburst
 */

import { interpolate, hierarchy, arc, select, partition, BaseType } from "d3";
import { Datum, DatumNode, Rectangle } from "./types";
import json from "./hierarchy.json";
import handlePopup from "./popup";
import playDatum from "./audio/datum";

import viola from "/viola.mp3";
import { csv } from "d3-fetch"; // Assuming you can use d3-fetch or an equivalent method

const AUDIO = <HTMLAudioElement>document.getElementById("viola");
if (!AUDIO) throw new Error("No container found with the ID 'viola'");

AUDIO.src = viola;

let intervalId: number;
let currentTime = 0;

// Define a structure to store the parsed CSV data
interface CsvRow {
  index: string;
  Disease: string;
  Timings: number;
  Category: string;
  Chakra: string; // Make sure this is included in your interface
}

export const TRANSITION_TIME = 750; // ms

const CONTAINER = document.getElementById("sunburst");
if (!CONTAINER) throw new Error("No container found with the ID 'sunburst'");

const WIDTH = CONTAINER.clientHeight; // px
const HEIGHT = WIDTH; // px
const RADIUS = WIDTH / 5; // px
const DATA: Datum = json;

const CHAKRA_COLORS = {
  ritu: "#bebada",
  indu: "#fcaea4",
  vasu: "#81b2d2",
  rudra: "#fcbc73",
  veda: "#b3dd69",
  aditya: "#fdd8eb",
  dishi: "#d9d9d9",
  bana: "#bc80bd",
  bhrama: "#d5eecf",
  netra: "#ffed6f",
  agni: "#93d6ca",
  rishi: "#ffd9b3",
};

const hierarchyNode = hierarchy(DATA)
  .sum((d) => d.value || 0)
  .sort((a, b) => (b.value || 0) - (a.value || 0));

// Title arcs: "category (charka)"
hierarchyNode.eachBefore((d) => {
  if (d.depth === 1) d.data.label = `${d.data.name} (${d.data.chakra})`;
});

const root = partition<Datum>().size([2 * Math.PI, hierarchyNode.height + 1])(
  hierarchyNode
) as DatumNode; // WARNING: Unvalidated typing (assumes all `DatumNode.current` and `DatumNode.target` will exist)
root.each((d) => (d.current = d)); // Should set all `DatumNode.current`

const svg = select<HTMLElement, Rectangle>(CONTAINER)
  .append<BaseType>("svg")
  .attr("viewBox", [-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT])
  .attr("preserveAspectRatio", "xMinYMin meet");

const arcGen = arc<Rectangle>()
  .startAngle((d) => d.x0)
  .endAngle((d) => d.x1)
  .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
  .padRadius(RADIUS * 1.5)
  .innerRadius((d) => d.y0 * RADIUS)
  .outerRadius((d) => Math.max(d.y0 * RADIUS, d.y1 * RADIUS - 1));

// Draw arcs
const path = svg
  .append("g")
  .selectAll("path")
  .data(root.descendants().slice(1))
  .join("path")
  .attr("fill", (d) => {
    let ancestor = d;
    while (ancestor.depth > 1 && ancestor.parent) ancestor = ancestor.parent;
    const chakra = ancestor.data.chakra;

    return chakra && chakra in CHAKRA_COLORS
      ? CHAKRA_COLORS[chakra as keyof typeof CHAKRA_COLORS]
      : "#cccccc";
  })
  .attr("data-category-chakra", (d) => `${d.data.name}(${d.data.chakra})`)
  .attr("fill-opacity", (d) =>
    shouldBeVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0
  )
  .attr("pointer-events", (d) => (shouldBeVisible(d.current) ? "auto" : "none"))
  .attr("d", (d) => arcGen(d.current));

path
  .filter((d) => !!d.children) // `!!` casts to bool
  .style("cursor", "pointer")
  .on("click", (_, d) => {
    handleClick(d);
    playDatum(d);
  });

// Draw titles
path.append("title").text(
  (d) =>
    `${d
      .ancestors()
      .map((d) => d.data.name)
      .reverse()
      .join("/")}\n`
);

// Draw labels
const label = svg
  .append("g")
  .attr("pointer-events", "none")
  .attr("text-anchor", "middle")
  .style("user-select", "none")
  .selectAll("text")
  .data(root.descendants().slice(1))
  .join("text")
  .attr("dy", "0.35em")
  .style("font-size", "small")
  .attr("fill-opacity", (d) => +shouldBeVisible(d.current))
  .attr("transform", (d) => labelTransform(d.current))
  .each(function (d) {
    const text = d.data.label || d.data.name;
    const arcLength = (d.y1 - d.y0) * RADIUS; // Estimate arc length available for the text
    const charactersPerLine = Math.floor(arcLength / 6); // Estimate max characters per line; adjust '6' based on your font size and styling

    if (text.length > charactersPerLine)
      // If the text is too long, split it into parts
      splitText(text, charactersPerLine).forEach((part, i) => {
        select(this)
          .append("tspan")
          .attr("x", 0) // Centered horizontally
          .attr("y", `${i * 1.2}em`) // Position each line; adjust '1.2em' based on your needs
          .attr("dy", `${i === 0 ? 0 : 0.2}em`) // Adjust vertical spacing for lines after the first
          .text(part);
      });
    // If the text fits in one line, just set it as the content of the text element
    else select(this).text(text);
  });

function splitText(text: string, maxLength: number): string[] {
  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    parts.push(text.substring(start, Math.min(start + maxLength, text.length)));
    start += maxLength;
  }
  return parts;
}

// Draw circle
const parent = svg
  .append("circle")
  .datum(root)
  .attr("r", RADIUS)
  .attr("fill", "none")
  .attr("pointer-events", "all")
  .on("click", (_, p) => handleClick(p));

function handleClick(p: DatumNode) {
  const popup = document.getElementById("diseasePopup");
  const sunburst = document.getElementById("sunburst"); // Reference to the sunburst container

  if (popup) popup.style.display = "none"; // Hide popup initially to handle any previous state
  if (p.depth === 2) return handlePopup(p);

  const t = svg.transition().duration(TRANSITION_TIME);

  parent.datum(p.parent || root);

  root.each(
    (d) =>
      (d.target = {
        x0:
          Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1:
          Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth),
      }) // Should set all `DatumNode.target`
  );

  // Transition the data on all arcs, even the ones that aren’t visible,
  // so that if this transition is interrupted, entering arcs will start
  // the next transition from the desired position.
  path
    .transition(t)
    .tween("data", (d) => {
      const i = interpolate(d.current, d.target);
      return (t) => (d.current = i(t));
    })
    .filter(function (d) {
      return (
        (this instanceof Element &&
          !!+(this.getAttribute("fill-opacity") ?? false)) ||
        shouldBeVisible(d.target)
      );
    })
    .attr("fill-opacity", (d) =>
      shouldBeVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0
    )
    .attr("pointer-events", (d) =>
      shouldBeVisible(d.target) ? "auto" : "none"
    )
    .attrTween("d", (d) => () => arcGen(d.current) ?? "");

  label
    .filter(function (d) {
      return (
        (this instanceof Element &&
          !!+(this.getAttribute("fill-opacity") ?? false)) ||
        shouldBeVisible(d.target)
      );
    })
    .transition(t)
    .attr("fill-opacity", (d) => +shouldBeVisible(d.target))
    .attrTween("transform", (d) => () => labelTransform(d.current));

  // Ensure the sunburst's opacity is reset if the popup is not displayed
  if (sunburst) sunburst.style.opacity = "1";
}

function shouldBeVisible(d: Rectangle) {
  return (
    d.y1 <= 2 &&
    d.y0 >= 1 &&
    d.x1 > d.x0 &&
    (d.y1 - d.y0) * (d.x1 - d.x0) > 0.001 // Hides labels with no arc
  );
}

function labelTransform(d: Rectangle) {
  const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
  const y = ((d.y0 + d.y1) / 2) * RADIUS;

  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}

// ----------- simulation ---------------------

let csvData: CsvRow[] = [];

// Load and parse the CSV file, ensuring 'Timings' is correctly typed as a number
async function loadCsvData() {
  const rawData = await csv("./seq.d3.csv"); // Adjust the path to your CSV file

  // Immediately convert 'Timings' from string to number during processing
  csvData = rawData.map((row) => {
    return {
      ...row,
      Timings: parseFloat(row["Timings"] as string), // Explicitly cast and convert
    };
  }) as CsvRow[]; // The cast here asserts that the transformation conforms to CsvRow
}

// Call loadCsvData to load the data
loadCsvData().catch((error) => console.error("Failed to load CSV data", error));

AUDIO.addEventListener("play", handlePlay);
AUDIO.addEventListener("pause", () => {
  console.log(`Pausing playback at ${AUDIO.currentTime}s`);
  clearInterval(intervalId);
});

function handlePlay() {
  console.log(`Starting playback: ${AUDIO.duration - currentTime}s remaining`);

  intervalId = window.setInterval(() => {
    currentTime = AUDIO.currentTime;
    console.log(`Current time: ${currentTime}s`);
    checkAndExecuteActions(currentTime);

    // Check for a matching timestamp and log the 'Category' and 'Disease'
    // Within handlePlay, modify the logging for a matching timestamp
    const matchingRow = csvData.find(
      (row) => Math.abs(row.Timings - currentTime) < 0.5
    );
    if (matchingRow) {
      console.log(
        `Match found at ${currentTime}s: ${matchingRow.Category} (${matchingRow.Chakra}), ${matchingRow.Disease}`
      );
    }

    if (AUDIO.duration - currentTime < 1) clearInterval(intervalId);
  }, 1000);
}

const scheduledActions = [
  { timestamp: 1.0, action: () => clickArc("endocrine(ritu)") },
  { timestamp: 44.2, action: () => clickArc("metabolic(indu)") },
  { timestamp: 67.3, action: () => clickArc("lyosomal(rudra)") },
  { timestamp: 94.5, action: () => clickArc("cns expansion(veda)") },
  { timestamp: 111.5, action: () => clickArc("skin(aditya)") },
  { timestamp: 116.9, action: () => clickArc("immuno(dishi)") },
  { timestamp: 127.6, action: () => clickArc("msk(bana)") },
  {
    timestamp: 171.3,
    action: () => clickArc("congenital & chromosomal(bhrama)"),
  },
  { timestamp: 290.7, action: () => clickArc("neurological(netra)") },
  { timestamp: 405.2, action: () => clickArc("digestive(agni)") },
  { timestamp: 414.2, action: () => clickArc("circulatory(rishi)") },
];

function clickArc(identifier: string) {
  console.log(`Attempting to click identifier: ${identifier}`);

  // Try to select by category and chakra first
  let arc = document.querySelector(
    `path[data-category-chakra='${identifier}']`
  );

  if (arc) {
    console.log(`Found arc matching 'category-chakra': ${identifier}`);
  } else {
    // If no category-chakra match is found, try to select by disease
    arc = document.querySelector(`path[data-disease='${identifier}']`);
    if (arc) {
      console.log(`Found arc matching 'disease': ${identifier}`);
    } else {
      // Log if no match is found for either category-chakra or disease
      console.log(`No arc found matching '${identifier}'.`);
      return; // Exit the function if no match is found
    }
  }

  // If an arc is found, dispatch a click event
  console.log(`Dispatching click event to arc.`);
  arc.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true })
  );
}

// Function to check and execute actions based on the current playback time
function checkAndExecuteActions(currentTime: number) {
  scheduledActions.forEach(({ timestamp, action }) => {
    if (Math.abs(timestamp - currentTime) < 0.5) {
      action();
    }
  });
}
