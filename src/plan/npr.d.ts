import type { Floorplan } from "../types/floorplan";
export interface RenderOptions {
  scale?: number; margin?: number; level?: string; seed?: number; fonts?: boolean; background?: boolean;
}
export function renderFloorplanSVG(plan: Floorplan, opts?: RenderOptions): string;
