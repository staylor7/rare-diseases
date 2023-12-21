import { csv, DSVParsedArray, PieArcDatum, arc, pie, select } from "d3";
import { Datum, DatumArcSVGElement, chakraToColor } from "./utils";

export async function parseCsv(path: string): Promise<DSVParsedArray<Datum>> {
  return await csv(path, (d) => {
    return {
      index: d.index,
      disease: d.Disease,
      disease_break: d.Disease_break,
      category: d.Category,
      chakra: d.Chakra,
      nphenotypes: parseInt(d.Nphenotype) || 0,
      ngenes: parseInt(d.Ngenes) || 0,
      elite: d.Elite,
      inheritance: d.Inheritance,
      nvariants: parseInt(d.Nvariants) || 0,
      phenoSys: d.Phenotype,
      gene: d.Gene,
      promoter: d.Promoter,
      malacards: d.Malacards,
    };
  });
}

export async function draw(
  data: DSVParsedArray<Datum>,
  container: HTMLElement
) {
  graph(data, container);
}

function playAudio(d: Datum) {
  let name: string;
  if (d.index.length === 1) {
    name = "00" + d.index;
  } else if (d.index.length === 2) {
    name = "0" + d.index;
  } else {
    name = d.index;
  }

  const audio = new Audio(`/promoter_sounds_mp3/dna${name}.mp3`);
  audio.play().catch((e: Error) => {
    console.error("Error playing audio:", e.message);
  });
}

function graph(data: DSVParsedArray<Datum>, container: HTMLElement) {
  const width = data.length * 5,
    height = data.length * 5,
    radius = Math.min(width, height) / 2,
    stroke = 3;

  const createArc = arc<PieArcDatum<Datum>>() // Misleading variable name?
    .innerRadius(radius * 0.3)
    .outerRadius((d) => radius * 0.75 + d.data.ngenes * 4);

  const createPie = pie<Datum>() // Misleading variable name?
    .padAngle(1 / radius)
    .sort(null)
    .value((d) => d.chakra.length);

  const svg = select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // from Jackson Levitt's Pie Chart
  const center = svg.append("g").attr("transform", `translate(${0}, ${0})`);

  center
    .append("circle")
    .attr("fill", "white")
    .attr("r", radius * 0.275);

  center
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(0, 10)`)
    //.attr("font-size", "0.75em")
    .attr("font-family", "system-ui")
    .attr("fill", "#999999")
    .attr("id", "centerText")
    .html("disease name");

  svg
    .append("g")
    .selectAll()
    .data(createPie(data))
    .join("path")
    .attr("fill", (d) => chakraToColor(d.data.chakra))
    .attr("d", createArc)
    .on("mouseenter", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .append("title")
    .style("width", (d) => chakraToColor(d.data.chakra) + "px")
    .text((d) => `${d.data.malacards}`);

  function handleMouseOver(e: MouseEvent) {
    const diseaseArc = e.target as DatumArcSVGElement;
    const d = diseaseArc.__data__.data;

    select(diseaseArc)
      .attr("stroke", "#fff")
      .attr("stroke-width", stroke)
      .transition()
      .duration(500);
    // .attr(
    //   "transform",
    //   GetTransform as ValueFn<SVGPathElement, unknown, string> // TODO: Fix misleading type inference
    // );

    select("#centerText").html(`${d.disease_break}`); // I've made a new column in the spreadsheet, "Disease_break" with <br> replacing spaces - but <br> doesn't do anything

    playAudio(d);

    // TODO: if I put the promoter seqence in the center, how can I format this string to fit inside the center circle?
    select("#diseaseText").html(`<b>${d.disease} </b><br>
    <font size="-1">${d.promoter} </font><br>
    index: ${d.index} <br>
    category: ${d.category}; ${d.chakra} chakra <br>
    gene: ${d.gene}; ${d.phenoSys} <br>
    inheritance: ${d.inheritance} <br>
    number of phenotypes: ${d.nphenotypes} <br>
    number of genes: ${d.ngenes}`);
  }

  // TODO: Make arc brighter
  /* function GetTransform(d: PieArcDatum<Datum>) {
    const dist = 1;
    const midAngle = (d.endAngle - d.startAngle) / 2 + d.startAngle;
    const x = Math.sin(midAngle) * dist;
    const y = Math.cos(midAngle) * dist;
    return "translate(" + x + "," + y + ")";
  } */
}

function handleMouseOut(e: MouseEvent) {
  const diseaseArc = e.target as SVGPathElement;

  select(diseaseArc).attr("stroke-width", "0px");
  select(diseaseArc)
    .transition()
    .duration(500)
    .attr("transform", "translate(0,0)");

  select("#mainText").html("Gene");
}
