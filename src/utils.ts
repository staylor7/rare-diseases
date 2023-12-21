import { DSVParsedArray, PieArcDatum, csv, scaleOrdinal } from "d3";

export type Datum = {
  index: string;
  disease: string;
  disease_break: string;
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
export type DatumArcSVGElement = SVGPathElement & {
  __data__: PieArcDatum<Datum>; // https://d3js.org/d3-selection/joining#selection_data
  __on: EventListener[];
};

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

export const chakraToColor = scaleOrdinal(
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
