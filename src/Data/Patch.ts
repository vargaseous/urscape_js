import { DataLayer } from "./DataLayer";
import { PatchSource } from "./DataSource";
import { AreaBounds } from "./DataUtils";
import { PatchData } from "./PatchData";

export type PatchObject = ReturnType<Patch["toObject"]>;

export const PatchConstants = {
  PATCH_PATH: "./data/"
}

export const PatchLevelZoomRanges: [number, number][] = [
  [0, 3],
  [3, 7],
  [7, 11],
  [11, 16],
  [16, 20],
  [20, 25]
];

export enum PatchLevel { A, B, C, D, E, F }

export type PatchInfo = {
  level: PatchLevel;
  name: string;
  site: string;
  index: number;
  filename: string;
  date: number;
}

export class Patch {
  public info: PatchInfo;
  public data?: PatchData;
  public bounds?: AreaBounds;
  public source?: PatchSource;
  public dataLayer?: DataLayer;

  constructor(info: PatchInfo, source?: PatchSource) {
    this.info = info;
    this.source = source;
  }

  public get id() {
    return this.info.site
      + this.info.name
      + this.info.level
      + this.info.index;
  }

  public toObject() {
    return {
      info: this.info,
      data: this.data,
      bounds: this.bounds
    }
  }

  public static fromObject(source: PatchSource, object: PatchObject) {
    const patch = new Patch(object.info, source);
    patch.data = object.data;
    patch.bounds = object.bounds;
    return patch;
  }
}
