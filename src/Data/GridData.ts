import { PatchData } from "./PatchData";

export interface GridData extends PatchData {
  values: Float32Array;
  mask: Uint8Array;
  countX: number;
  countY: number;
}
