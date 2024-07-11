import { DataLayer } from "./DataLayer";
import { PatchData } from "./PatchData";

export const PatchConstants = {
  PATCH_PATH: "./data/"
}

export type PatchLevel = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type PatchHeader = {
  level: PatchLevel;
  name: string;
  site: string;
  patch: number;
  filename: string;
  date: Date;
}

export interface Patch {
  layer: DataLayer;
  header: PatchHeader;
  data?: PatchData;
}
