import { PatchData } from "./PatchData";

export interface GridData extends PatchData {
  values: Float32Array;
  mask: number | null;
  countX: number;
  countY: number;
}
