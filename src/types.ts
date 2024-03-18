import { HierarchyRectangularNode } from "d3";

/**
 * Implied properties for each JSON object in `hierarchy.json`
 */
export type Datum = {
  name: string;
  chakra?: string;
  value?: number;
  label?: string;
  children?: Datum[];
};

/**
 * Properties extended by {@link HierarchyRectangularNode}
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

export type ScheduledAction = {
  chakra: string;
  disease: string;
  timestamp: number;
};
