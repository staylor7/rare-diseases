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
  gene: string;
  ngenes: number;
  nphenotype: number;
  nvariants: number;
  phenoSys: string;
  promoter: string;
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
    "#8dd3c7",
    "#ffffb3",
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
  ]
);

export async function readData(file: string, container: HTMLElement) {
  const data: DSVParsedArray<Datum> = await csv(file, (d) => {
    return {
      disease: d.Disease,
      category: d.Category,
      chakra: d.Chakra,
      gene: d.Gene,
      ngenes: parseInt(d.Ngenes) || 0,
      nphenotype: parseInt(d.Nphenotype) || 0,
      nvariants: parseInt(d.Nvariants) || 0,
      phenoSys: d.Phenotype_System,
      promoter: d.Promoter,
    };
  });

  try {
    graph(data, container);
  } catch (e) {
    console.error(e);
  }
}

function graph(data: DSVParsedArray<Datum>, container: HTMLElement) {
  const width = data.length * 4,
    height = data.length * 4,
    radius = Math.min(width, height) / 2;

  const diseaseArc = arc<PieArcDatum<Datum>>()
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

  svg
    .append("g")
    .selectAll()
    .data(createPie(data))
    .join("path")
    .attr("fill", (d) => chakraToColor(d.data.chakra))
    .attr("d", diseaseArc)
    .append("title")
    .text((d) => `${d.data.chakra}: ${d.data.chakra.toLocaleString()}`); // What's this for?

  svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .selectAll()
    .data(createPie(data))
    .join("text")
    .attr("transform", (d) => `translate(${diseaseArc.centroid(d)})`)
    .call(
      (text) =>
        text
          .append("tspan")
          .attr("y", "-0.4em")
          .attr("font-weight", "normal")
          //.text(d => d.data.gene))
          .text("") // TODO: Appear on mousover (blank for now)
    )
    .call((text) =>
      text
        .filter((d) => d.endAngle - d.startAngle > 0.25)
        .append("tspan")
        .attr("x", 0)
        .attr("y", "0.7em")
        .attr("fill-opacity", 0.7)
        .text((d) => d.data.gene)
    );
}
