import { Patch } from "./Patch";
import { GridData } from "./GridData";

export interface GridPatch extends Patch {
  data?: GridData;
}
