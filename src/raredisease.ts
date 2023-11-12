import {
  csv,
  DSVParsedArray,
  PieArcDatum,
  scaleOrdinal,
  arc,
  pie,
  select,
} from "d3";

type Datum = {
  disease: string;
  category: string;
  chakra: string;
  nphenotypes: number;
  ngenes: number;
  elite: string;
  inheritance: string;
  nvariants: number;
  phenoSys: string;
  gene: string;
  promoter: string;
  malacards: string;
};

// Hacky workaround for type issues, probably inaccurate
type DatumArcSVGElement = SVGPathElement & {
  __data__: PieArcDatum<Datum>; // https://d3js.org/d3-selection/joining#selection_data
  __on: EventListener[];
};

const chakraToColor = scaleOrdinal(
  [
    "ritu",
    "indu",
    "vasu",
    "rudra",
    "veda",
    "aditya",
    "dishi",
    "bana",
    "bhrama",
    "netra",
    "agni",
    "rishi",
  ],
  [
    "#bebada",
    "#fb8072",
    "#80b1d3",
    "#fdb462",
    "#b3de69",
    "#fccde5",
    "#d9d9d9",
    "#bc80bd",
    "#ccebc5",
    "#ffed6f",    
    "#8dd3c7",
    "#FFD9B2",
  ]
);

export async function readData(file: string, container: HTMLElement) {
  const data: DSVParsedArray<Datum> = await csv(file, (d) => {
    return {
      disease: d.Disease,
      category: d.Category,
      chakra: d.Chakra,
      nphenotypes: parseInt(d.Nphenotype) || 0, // Nphenotype(s?)
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

  try {
    graph(data, container);
  } catch (e) {
    console.error(e);
  }
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
      .duration(500)
      //.attr("transform", GetTransform);

    select("#centerText").html(`${d.disease}`);

    // TODO: if I put the promoter seqence in the center, how can I format this string to fit inside the center circle?
    select("#diseaseText").html(`<b>${d.disease} </b><br>
    <font size="-1">${d.promoter} </font><br>
    gene: ${d.gene}; ${d.phenoSys} <br>
    category: ${d.category}; ${d.chakra} chakra <br>
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

  function handleMouseOut(e: MouseEvent) {
    const diseaseArc = e.target as SVGPathElement;

    select(diseaseArc).attr("stroke-width", "0px");
    select(diseaseArc)
      .transition()
      .duration(500)
      .attr("transform", "translate(0,0)");

    select("#mainText").html("Gene");
  }
}
