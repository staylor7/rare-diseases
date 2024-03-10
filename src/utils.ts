import { DSVParsedArray, PieArcDatum, csv, scaleOrdinal } from "d3";

export type Datum = {
  name: string;
  children: Datum[];
  value?: number;
  label?: string;
};

/**
 * @deprecated
 * Represents a data point.
 */
export type FullDatum = {
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

/**
 * @deprecated
 * Represents a SVG element with additional properties for PieArcDatum.
 */
export type DatumArcSVGElement = SVGPathElement & {
  __data__: PieArcDatum<Datum>; // https://d3js.org/d3-selection/joining#selection_data
  __on: EventListener[];
};

/**
 * @deprecated
 * Parses a CSV file and returns the data as an array of objects.
 * @param path - The path to the CSV file.
 * @returns A promise that resolves to the parsed CSV data.
 */
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

/**
 * Maps chakra values to corresponding colors.
 */
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
