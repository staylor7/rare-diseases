import {
  hierarchy,
  group,
  DSVParsedArray,
  interpolate,
  interpolateRainbow,
  partition,
  quantize,
  scaleOrdinal,
  arc,
  select,
  format,
} from "d3";
import { Datum } from "./utils";
import * as d3 from 'd3';

interface HierarchicalDatum {
  name: string;
  value?: number;
  children?: HierarchicalDatum[];
}

interface Target {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface ExtendedNode extends d3.HierarchyRectangularNode<HierarchicalDatum> {
  current?: ExtendedNode;
  target?: Target;
}


export function stratify(csv: DSVParsedArray<Datum>) {
  return hierarchy(
    group(
      csv,
      (d) => d.chakra,
      (d) => d.category,
      (d) => d.phenoSys,
      (d) => d.inheritance
    )
  );
}

export function draw(csv: DSVParsedArray<Datum>, container: HTMLElement) {
  const data = stratify(csv);
  console.log(data);

  // Specify the chart’s dimensions.
  const width = 928;
  const height = width;
  const radius = width / 6;


function arcVisible(d: Target) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d: Target) {
    // Assuming labelVisible's logic is similar to arcVisible
    // Adjust the logic here as needed based on what labelVisible is supposed to do
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
}

function labelTransform(d: ExtendedNode) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}

  // Create the color scale
  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children?.length || 0 + 1));

  // Compute the layout
  const hierarchy = d3.hierarchy(data)
      .sum(d => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const root: ExtendedNode = d3.partition<HierarchicalDatum>()
      .size([2 * Math.PI, hierarchy.height + 1])
      (hierarchy as unknown as ExtendedNode);

  root.each(d => (d as ExtendedNode).current = d as ExtendedNode);

  // Create the arc generator
  const arcGenerator = d3.arc<ExtendedNode>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius(d => d.y0 * radius)
      .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

  // Create the SVG container
  const svg = d3.select("#chart").append("svg")
      .attr("viewBox", [-width / 2, -height / 2, width, width])
      .style("font", "10px sans-serif");

  // Append the arcs
  const path = svg.append("g")
      .selectAll("path")
      .data(root.descendants().slice(1))
      .join("path")
          .attr("fill", d => { while (d.depth > 1) d = d.parent!; return color(d.data.name); })
          .attr("fill-opacity", d => arcVisible(d.current!) ? (d.children ? 0.6 : 0.4) : 0)
          .attr("d", d => arcGenerator(d.current!));

  // Make them clickable if they have children
  path.filter(d => !!d.children && d.children.length > 0)
  .style("cursor", "pointer")
  .on("click", clicked);

  // Add titles
  const format = d3.format(",d");
  path.append("title")
    .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value ?? 0)}`);

  // Add labels
  const label = svg.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
          .attr("dy", "0.35em")
          .attr("fill-opacity", d => +labelVisible(d.current!))
          .attr("transform", d => labelTransform(d.current!))
          .text(d => d.data.name);

  // Add parent circle
  const parent = svg.append("circle")
      .datum(root)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked);

  // Handle zoom on click
  function clicked(event: MouseEvent, p: ExtendedNode) {
      parent.datum(p.parent || root);

      root.each(d => (d as ExtendedNode).target = {
          x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth)
      });

  // Apply the transition to other elements
  path.transition().duration(750)
    .tween("data", d => {
            // Ensure that d.current and d.target are defined before interpolating
          if (d.target) {
            const interpolator = d3.interpolate(d.current as Target, d.target);
            return (transitionProgress: number) => {
                // Safely update d.current with the interpolated value
                d.current = interpolator(transitionProgress) as unknown as ExtendedNode;
            };
        } else {
            return () => {}; // Return an empty function if d.current or d.target is undefined
        }
    })
    .filter((d: ExtendedNode) => {
      const element = d3.select(this as Element);
      const fillOpacity = element.attr("fill-opacity");
      const hasOpacity = fillOpacity !== null && parseFloat(fillOpacity) > 0;
      const isVisible = d.target ? arcVisible(d.target) : false;
      return hasOpacity || isVisible;
  })  
    .attr("fill-opacity", d => d.target && arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
    .attr("pointer-events", d => d.target && arcVisible(d.target) ? "auto" : "none")
  
    .attrTween("d", d => {
      return () => {
          const pathData = arcGenerator(d.current!);
          return pathData || ""; // Fallback to an empty string if null
      };
  })

  // Apply a transition directly to the label
    label.filter(function(d: ExtendedNode) {
      const element = d3.select(this as Element);
      const fillOpacity = element.attr("fill-opacity");
      const hasOpacity = fillOpacity !== null && parseFloat(fillOpacity) > 0;
      const isVisible = d.target ? labelVisible(d.target) : false;
      return hasOpacity || isVisible;
  })
  .transition().duration(750)
  .attr("fill-opacity", d => d.target && labelVisible(d.target) ? 1 : 0)
  .attrTween("transform", d => () => labelTransform(d.current!));
  }
};
