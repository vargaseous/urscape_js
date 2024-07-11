import { PatchData } from "./PatchData";

export interface GridData extends PatchData {
  values: number[];
  mask: number[];
  countX: number;
  countY: number;
}
