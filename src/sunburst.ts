/**
 * Based off of https://observablehq.com/@d3/zoomable-sunburst
 */

import { interpolate, hierarchy, arc, select, partition, BaseType } from "d3";
import { Datum, DatumNode, Rectangle } from "./types";
import json from "./hierarchy.json";
import handlePopup from "./popup";
import playDatum from "./audio/datum";

export const TRANSITION_TIME = 750; // ms

const CONTAINER = document.getElementById("sunburst");
if (!CONTAINER) throw new Error("No container found with the ID 'sunburst'");

const WIDTH = CONTAINER.clientHeight; // px
const HEIGHT = WIDTH; // px
const RADIUS = WIDTH / 5; // px
const DATA: Datum = json;

const chakraColorMapping = {
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

//draw arcs
type ChakraName = keyof typeof chakraColorMapping;

const path = svg
  .append("g")
  .selectAll("path")
  .data(root.descendants().slice(1))
  .join("path")
  .attr("fill", (d) => {
    let ancestor = d;
    while (ancestor.depth > 1 && ancestor.parent) ancestor = ancestor.parent;
    const chakra = ancestor.data.chakra;
    // Assert that chakra is a key of chakraColorMapping
    const color = chakra ? chakraColorMapping[chakra as ChakraName] : undefined;
    return color || "#cccccc"; // Fallback color
  })
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
  .style("font-size", "11px") // Adjust the font size as needed
  .attr("fill-opacity", (d) => +shouldBeVisible(d.current))
  .attr("transform", (d) => labelTransform(d.current))
  .each(function (d) {
    const text = d.data.label || d.data.name;
    const arcLength = (d.y1 - d.y0) * RADIUS; // Estimate arc length available for the text
    const charactersPerLine = Math.floor(arcLength / 6); // Estimate max characters per line; adjust '6' based on your font size and styling
    if (text.length > charactersPerLine) {
      // If the text is too long, split it into parts
      const parts = splitText(text, charactersPerLine);
      parts.forEach((part, i) => {
        select(this)
          .append("tspan")
          .attr("x", 0) // Centered horizontally
          .attr("y", `${i * 1.2}em`) // Position each line; adjust '1.2em' based on your needs
          .attr("dy", `${i === 0 ? 0 : 0.2}em`) // Adjust vertical spacing for lines after the first
          .text(part);
      });
    } else {
      // If the text fits in one line, just set it as the content of the text element
      select(this).text(text);
    }
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
