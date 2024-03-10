import {
  csv,
  interpolate,
  interpolateRainbow,
  json,
  hierarchy as d3Hierarchy,
  arc as d3Arc,
  select,
  partition,
  quantize,
  scaleOrdinal,
} from "d3";
import { Datum } from "./utils";

const container = document.getElementById("sunburst");

if (container) draw(container);

export async function draw(container: HTMLElement) {
  const data = (await json("hierarchy.json")) as Datum; // WARNING: Forced typing (not validated, risks runtime error)

  // Specify the chart’s dimensions
  const width = 928;
  const height = width;
  const radius = width / 6;

  // Create the color scale
  const color = scaleOrdinal(
    quantize(interpolateRainbow, data.children.length + 1)
  );

  // Compute the layout
  const hierarchy = d3Hierarchy(data)
    .sum((d) => d.value || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  const root = partition<Datum>().size([2 * Math.PI, hierarchy.height + 1])(
    hierarchy
  );
  root.each((d) => (d.current = d));

  // Create the arc generator
  const arc = d3Arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius((d) => d.y0 * radius)
    .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

  // Create the SVG container
  const svg = select(container)
    .append("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .style("font", "10px sans-serif");

  // Append the arcs
  const path = svg
    .append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
    .attr("fill", (d) => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .attr("fill-opacity", (d) =>
      arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0
    )
    .attr("d", (d) => arc(d.current));

  // Chakra playback
  let currentChakraAudio = new Audio();
  let currentDiseaseAudio = new Audio();

  // Function to extract chakra name from the string
  function extractChakraName(name: string) {
    const match = name.match(/\(([^)]+)\)/); // Regular expression to find text in parentheses
    return match ? match[1] : null; // Return the matched group or null if no match
  }

  // Function to play chakra sound
  function playChakraSound(chakraName) {
    console.log("Playing chakra sound for:", chakraName);
    const filePath = `chakra_sounds_mp3/${chakraName}.mp3`;
    if (currentChakraAudio) {
      currentChakraAudio.pause();
      currentChakraAudio.currentTime = 0;
    }
    currentChakraAudio = new Audio(filePath);
    currentChakraAudio.loop = true;
    currentChakraAudio.play().catch((e) => {
      console.error("Failed to play chakra audio:", e);
    });
  }

  // ---- Disease sound ----------
  let diseaseData = []; // This will store the parsed CSV data

  // Function to load and parse the CSV
  function loadDiseaseData() {
    csv("seq.d3.csv").then((data) => {
      diseaseData = data;
    });
  }

  // Call the function to load the data
  loadDiseaseData();

  path
    .filter((d) => d.children)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      clicked(event, d); // Existing click functionality

      if (d.depth === 1) {
        // Check if it's a chakra node
        const chakraName = extractChakraName(d.data.name);
        if (chakraName) {
          playChakraSound(chakraName); // Play the sound for the chakra
        }
      } else if (d.depth === 2) {
        // Check if it's a disease node
        const diseaseName = d.data.name;
        const rowNumber = getRowNumberForDisease(diseaseName);
        if (rowNumber !== null) {
          playDiseaseSound(rowNumber); // Play the sound for the disease
        }
      }
    });

  // Function to get the row number for a disease
  function getRowNumberForDisease(diseaseName) {
    const diseaseEntry = diseaseData.find(
      (entry) => entry.Disease === diseaseName
    );
    return diseaseEntry ? diseaseEntry.index : null;
  }

  // Function to play disease sound
  function playDiseaseSound(rowNumber) {
    console.log("Playing disease sound for row number:", rowNumber);
    rowNumber = String(rowNumber).padStart(3, "0");
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
    .attr("r", radius)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("click", clicked);

  // Handle zoom on click.
  function clicked(event, p) {
    parent.datum(p.parent || root);

    root.each(
      (d) =>
        (d.target = {
          x0:
            Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) *
            2 *
            Math.PI,
          x1:
            Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) *
            2 *
            Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth),
        })
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
        return +this.getAttribute("fill-opacity") || arcVisible(d.target);
      })
      .attr("fill-opacity", (d) =>
        arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0
      )
      .attr("pointer-events", (d) => (arcVisible(d.target) ? "auto" : "none"))

      .attrTween("d", (d) => () => arc(d.current));

    label
      .filter(function (d) {
        return +this.getAttribute("fill-opacity") || labelVisible(d.target);
      })
      .transition(t)
      .attr("fill-opacity", (d) => +labelVisible(d.target))
      .attrTween("transform", (d) => () => labelTransform(d.current));
  }

  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = ((d.y0 + d.y1) / 2) * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }
}
