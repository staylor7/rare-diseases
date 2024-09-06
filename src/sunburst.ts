/**
 * Based off of https://observablehq.com/@d3/zoomable-sunburst
 */

import { interpolate, hierarchy, arc, select, partition, BaseType } from "d3";
import { CHAKRA_COLORS, ORDERED_CHAKRAS, TRANSITION_TIME } from "./constants";
import { Datum, DatumNode, Rectangle } from "./types";
import json from "./hierarchy.json";
import handlePopup from "./popup";
import playDatum from "./audio/datum";
import "./audio/viola";

const CONTAINER = document.getElementById("sunburst");
if (!CONTAINER) throw new Error("No container found with the ID 'sunburst'");

const WIDTH = CONTAINER.clientHeight; // px
const HEIGHT = WIDTH; // px
const RADIUS = WIDTH / 5; // px
const DATA: Datum = json;

const HIERARCHY_ROOT = hierarchy(DATA)
  .sum((d) => d.value || 0)
  .sort((a, b) => (b.value || 0) - (a.value || 0))
  .each((d) => {
    if (d.depth === 1) d.data.label = `${d.data.name} (${d.data.chakra})`; // Chakra title

    d.children?.sort((a, b) =>
      // Sort Datums that represent chakras
      a.data.chakra && b.data.chakra
        ? ORDERED_CHAKRAS.indexOf(a.data.chakra) -
          ORDERED_CHAKRAS.indexOf(b.data.chakra)
        : 0
    );
  });

const ROOT = partition<Datum>()
  .size([2 * Math.PI, HIERARCHY_ROOT.height + 1])(HIERARCHY_ROOT)
  .each(
    (d) =>
      ((d as DatumNode).current = { x0: d.x0, y0: d.y0, x1: d.x1, y1: d.y1 })
  ) as DatumNode; // WARNING: Unvalidated typing (assumes all `DatumNode.current` and `DatumNode.target` will exist). Should set all `DatumNode.current`

const SVG = select<HTMLElement, Rectangle>(CONTAINER)
  .append<BaseType>("svg")
  .attr("viewBox", [-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT])
  .attr("preserveAspectRatio", "xMinYMin meet");

const arcGen = arc<Rectangle>()
  .startAngle((d) => d.x0 - (11 * Math.PI) / 120)
  .endAngle((d) => d.x1 - (11 * Math.PI) / 120)
  .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
  .padRadius(RADIUS * 1.5)
  .innerRadius((d) => d.y0 * RADIUS)
  .outerRadius((d) => Math.max(d.y0 * RADIUS, d.y1 * RADIUS - 1));

// Draw arcs
const path = SVG.append("g")
  .selectAll("path")
  .data(ROOT.descendants().slice(1))
  .join("path")
  .attr("fill", (d) => {
    let ancestor = d;
    while (ancestor.depth > 1 && ancestor.parent) ancestor = ancestor.parent;
    const chakra = ancestor.data.chakra;

    return chakra && chakra in CHAKRA_COLORS
      ? CHAKRA_COLORS[chakra as keyof typeof CHAKRA_COLORS]
      : "#cccccc";
  })
  .attr("data-category-chakra", (d) => `${d.data.name}`)
  .attr("fill-opacity", (d) =>
    shouldBeVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0
  )
  .attr("pointer-events", (d) => (shouldBeVisible(d.current) ? "auto" : "none"))
  .attr("d", (d) => arcGen(d.current));

path
  .filter((d) => Boolean(d.children))
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
const label = SVG.append("g")
  .attr("pointer-events", "none")
  .attr("text-anchor", "middle")
  .style("user-select", "none")
  .selectAll("text")
  .data(ROOT.descendants().slice(1)) // Exclude the root
  .join("text")
  .attr("dy", "0.35em")
  .style("font-size", "small")
  .attr("fill-opacity", (d) => +shouldBeVisible(d.current))
  .attr("transform", (d) => labelTransform(d.current))
  .each(function (d) {
    const text = d.data.label || d.data.name;
    const arcLength = (d.y1 - d.y0) * RADIUS; // Estimate arc length available for the text
    const charactersPerLine = Math.floor(arcLength / 7); // Estimate max characters per line; adjust '6' based on your font size and styling

    if (d.depth >= 2) {
      // Replace someValue with the actual depth value that differentiates categories from diseases
      // For disease-level labels, truncate and add '...' if the text is too long
      if (text.length > charactersPerLine) {
        const allowedLength = charactersPerLine - 3; // Adjust for the length of '...'
        select(this).text(text.substr(0, allowedLength) + "...");
      } else {
        select(this).text(text);
      }
    } else {
      // For category-level labels, attempt to split the text if it's too long
      if (text.length > charactersPerLine) {
        const parts = splitText(text, charactersPerLine); // Assuming splitText is defined elsewhere
        parts.forEach((part, i) => {
          select(this)
            .append("tspan")
            .attr("x", 0) // Centered horizontally
            .attr("y", `${i * 1.2}em`) // Position each line; adjust '1.2em' based on your needs
            .attr("dy", `${i === 0 ? 0 : 0.2}em`) // Adjust vertical spacing for lines after the first
            .text(part);
        });
      } else {
        select(this).text(text);
      }
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
const parent = SVG.append("circle")
  .datum(ROOT)
  .attr("r", RADIUS)
  .attr("fill", "none")
  .attr("pointer-events", "all")
  .on("click", (_, p) => handleClick(p));

function handleClick(p: DatumNode) {
  const popup = document.getElementById("diseasePopup");
  const sunburst = document.getElementById("sunburst"); // Reference to the sunburst container

  if (popup) popup.style.display = "none"; // Hide popup initially to handle any previous state
  if (p.depth === 2) return handlePopup(p);

  const t = SVG.transition().duration(TRANSITION_TIME);

  parent.datum(p.parent || ROOT);

  ROOT.each(
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
  const x = (d.x0 + d.x1) / 2 + 4.42; // Not a good way but 4.42 somehow works lol
  const normalizedX = (x + 2 * Math.PI) % (2 * Math.PI); // Normalize the angle, ensuring it stays within 0 to 2*PI
  const angle = normalizedX * (180 / Math.PI); // Convert angle from radians to degrees
  const radius = ((d.y0 + d.y1) / 2) * RADIUS;

  let textRotation;

  // Adjusting based on normalized angles considering the added offset
  if ((angle >= 0 && angle < 90) || (angle >= 270 && angle < 360)) {
    // Right half of the circle after rotation, including the right upper quadrant (0 to 90) and lower right quadrant (270 to 360)
    textRotation = angle;
  } else {
    textRotation = angle + 180;
  }

  return `translate(${Math.cos(normalizedX) * radius}, ${
    Math.sin(normalizedX) * radius
  }) rotate(${textRotation})`;
}

export function clickArc(identifier: string) {
  const arcElement = document.querySelector(
    `path[data-category-chakra='${identifier}']`
  );

  if (arcElement)
    arcElement.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );
}
