import { PieArcDatum, scaleOrdinal } from "d3";

export type Datum = {
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
export type DatumArcSVGElement = SVGPathElement & {
  __data__: PieArcDatum<Datum>; // https://d3js.org/d3-selection/joining#selection_data
  __on: EventListener[];
};

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
       "#FFD9B2", 
       "#bebada", 
       "#fb8072", 
       "#80b1d3", 
       "#fdb462", 
       "#b3de69", 
       "#fccde5", 
       "#d9d9d9", 
       "#bc80bd", 
       "#ccebc5", 
       "#ffed6f"
  ]
);
