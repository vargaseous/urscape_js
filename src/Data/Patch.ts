import { DataSource } from "./DataSource";
import { AreaBounds } from "./DataUtils";
import { PatchData } from "./PatchData";

export const PatchConstants = {
  PATCH_PATH: "./data/"
}

export const PatchLevelZoomRanges: [number, number][] = [
  [0, 3],
  [3, 7],
  [7, 11],
  [11, 16],
  [16, 20],
  [20, 22]
];

export enum PatchLevel { A, B, C, D, E, F }

export type PatchInfo = {
  level: PatchLevel;
  name: string;
  site: string;
  index: number;
  filename: string;
  date: Date;
}

export class Patch {
  public info: PatchInfo;
  public data?: PatchData;
  public bounds: AreaBounds;
  public source: DataSource;

  constructor(source: DataSource, info: PatchInfo, bounds: AreaBounds) {
    this.info = info;
    this.bounds = bounds;
    this.source = source;
  }

  public get id() {
    return this.info.site
      + this.info.name
      + this.info.level
      + this.info.index;
  }
}
