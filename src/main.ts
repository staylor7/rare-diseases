/**
 * Based off of https://observablehq.com/@d3/zoomable-sunburst
 */

import {
  csv,
  interpolate,
  interpolateRainbow,
  json,
  hierarchy,
  arc,
  select,
  partition,
  quantize,
  scaleOrdinal,
  BaseType,
} from "d3";
import { Datum, DatumNode, Rectangle } from "./utils";

const CONTAINER = document.getElementById("sunburst");
if (!CONTAINER) throw new Error("No container found with the ID 'sunburst'");

const WIDTH = 928;
const HEIGHT = WIDTH;
const RADIUS = WIDTH / 6;
const DATA = (await json("hierarchy.json")) as Datum; // WARNING: Unvalidated typing (JSON should match object)
const CSV = await csv("seq.d3.csv");

// Chakra playback
let currentChakraAudio = new Audio();
let currentDiseaseAudio = new Audio();

// Create the color scale
const color = scaleOrdinal(
  quantize(interpolateRainbow, DATA.children?.length ?? 0 + 1)
);

// Compute the layout
const hierarchyGen = hierarchy(DATA)
  .sum((d) => d.value || 0)
  .sort((a, b) => (b.value || 0) - (a.value || 0));

const root = partition<Datum>().size([2 * Math.PI, hierarchyGen.height + 1])(
  hierarchyGen
) as DatumNode; // WARNING: Unvalidated typing (assumes all `DatumNode.current` and `DatumNode.target` will exist)
root.each((d) => (d.current = d)); // Should set all `DatumNode.current`

// SVG container
const svg = select<HTMLElement, Rectangle>(CONTAINER)
  .append<BaseType>("svg")
  .attr("viewBox", [-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT])
  .style("font", "10px sans-serif");

// Arc generator
const arcGen = arc<Rectangle>()
  .startAngle((d) => d.x0)
  .endAngle((d) => d.x1)
  .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
  .padRadius(RADIUS * 1.5)
  .innerRadius((d) => d.y0 * RADIUS)
  .outerRadius((d) => Math.max(d.y0 * RADIUS, d.y1 * RADIUS - 1));

// Append the arcs
const path = svg
  .append("g")
  .selectAll("path")
  .data(root.descendants().slice(1))
  .join("path")
  .attr("fill", (d) => {
    while (d.depth > 1 && d.parent) d = d.parent;
    return color(d.data.name);
  })
  .attr("fill-opacity", (d) =>
    arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0
  )
  .attr("d", (d) => arcGen(d.current));

function extractChakraName(name: string) {
  const match = name.match(/\(([^)]+)\)/); // Regular expression to find text in parentheses
  return match ? match[1] : null; // Return the matched group or null if no match
}

function playChakraSound(chakraName: string) {
  const filePath = `chakra_sounds_mp3/${chakraName}.mp3`;
  if (currentChakraAudio) {
    currentChakraAudio.pause();
    currentChakraAudio.currentTime = 0;
  }

  currentChakraAudio = new Audio(filePath);
  currentChakraAudio.loop = true;
  currentChakraAudio.play();
}

path
  .filter((d) => !!d.children) // `!!` casts to bool
  .style("cursor", "pointer")
  .on("click", (event, d) => {
    handleClick(event, d); // Existing click functionality

    if (d.depth === 1) {
      // Check if it's a chakra node
      const chakraName = extractChakraName(d.data.name);
      if (chakraName) playChakraSound(chakraName);
    } else if (d.depth === 2) {
      // Check if it's a disease node
      const diseaseName = d.data.name;
      const rowNumber = getRowNumberForDisease(diseaseName);
      if (rowNumber !== null) playDiseaseSound(rowNumber); // Play the sound for the disease
    }
  });

// Function to get the row number for a disease
function getRowNumberForDisease(diseaseName: string) {
  const diseaseEntry = CSV.find((entry) => entry.Disease === diseaseName);
  return diseaseEntry ? diseaseEntry.index : null;
}

function playDiseaseSound(rowNumber: string) {
  console.log("Playing disease sound for row number:", rowNumber);
  rowNumber = rowNumber.padStart(3, "0");
  const filePath = `promoter_sounds_mp3/dna${rowNumber}.mp3`;

  if (currentDiseaseAudio) {
    currentDiseaseAudio.pause();
    currentDiseaseAudio.currentTime = 0;
  }

  currentDiseaseAudio = new Audio(filePath);
  currentDiseaseAudio.play().catch((e) => {
    console.error("Failed to play disease audio:", e);
  });
}

// Add titles
path.append("title").text(
  (d) =>
    `${d
      .ancestors()
      .map((d) => d.data.name)
      .reverse()
      .join("/")}\n`
);

// Add labels
const label = svg
  .append("g")
  .attr("pointer-events", "none")
  .attr("text-anchor", "middle")
  .style("user-select", "none")
  .selectAll("text")
  .data(root.descendants().slice(1))
  .join("text")
  .attr("dy", "0.35em")
  .attr("fill-opacity", (d) => +labelVisible(d.current))
  .attr("transform", (d) => labelTransform(d.current))
  .text((d) => d.data.label || d.data.name);

// Add parent circle
const parent = svg
  .append("circle")
  .datum(root)
  .attr("r", RADIUS)
  .attr("fill", "none")
  .attr("pointer-events", "all")
  .on("click", handleClick);

// Handle zoom on click
function handleClick(_: Event, p: DatumNode) {
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

  const t = svg.transition().duration(750);

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
        arcVisible(d.target)
      );
    })
    .attr("fill-opacity", (d) =>
      arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0
    )
    .attr("pointer-events", (d) => (arcVisible(d.target) ? "auto" : "none"))
    .attrTween("d", (d) => () => arcGen(d.current) ?? "");

  label
    .filter(function (d) {
      return (
        (this instanceof Element &&
          !!+(this.getAttribute("fill-opacity") ?? false)) ||
        labelVisible(d.target)
      );
    })
    .transition(t)
    .attr("fill-opacity", (d) => +labelVisible(d.target))
    .attrTween("transform", (d) => () => labelTransform(d.current));
}

function arcVisible(d: Rectangle) {
  return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
}

function labelVisible(d: Rectangle) {
  return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
}

function labelTransform(d: Rectangle) {
  const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
  const y = ((d.y0 + d.y1) / 2) * RADIUS;
  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}
