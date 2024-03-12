import { HierarchyRectangularNode, scaleOrdinal } from "d3";

/**
 * Properties for each data object in `hierarchy.json`
 */
export interface Datum {
  name: string;
  value?: number;
  label?: string;
  children?: Datum[];
}

/**
 * Extended properties from {@link HierarchyRectangularNode}
 */
export type Rectangle = {
  /**
   * The left edge of the rectangle.
   */
  x0: number;

  /**
   * The top edge of the rectangle
   */
  y0: number;

  /**
   * The right edge of the rectangle.
   */
  x1: number;

  /**
   * The bottom edge of the rectangle.
   */
  y1: number;
};

/**
 * Stores current and target locations for interactions
 * @todo Verify this is the correct polymorphism (Should {@link DatumNode} and {@link Rectangle} should be somewhat interchangeable?)
 */
export interface DatumNode extends HierarchyRectangularNode<Datum> {
  target: Rectangle;
  current: Rectangle;
}

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
