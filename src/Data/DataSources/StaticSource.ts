import { AreaBounds } from "../DataUtils";
import { DataSource, parseInfo } from "../DataSource";
import { Patch, PatchConstants, PatchInfo } from "../Patch";

import worker from "../../Workers/GridParser";

export class StaticSource implements DataSource {
  public async checkAvailability(): Promise<boolean> {
    return true;
  }

  public async getAvailablePatches(): Promise<PatchInfo[]> {
    const base = window.location.origin + import.meta.env.BASE_URL;
    const url = new URL(PatchConstants.PATCH_PATH + "manifest.json", base).href;

    const response = await fetch(url);
    if (!response) throw Error("Error loading manifest file");

    const paths = await response.json() as string[];

    return paths.map(path => {
      const filename = path.substring(path.lastIndexOf('/') + 1);
      const info = parseInfo(filename);
      if (info) return info;
      throw Error("Invalid filename format");
    })
  }

  public async getPatch(info: PatchInfo, includeData: boolean): Promise<Patch> {
    const path = `${info.site}/${info.filename}`;
    const base = window.location.origin + import.meta.env.BASE_URL;
    const url = new URL(PatchConstants.PATCH_PATH + path, base).href;

    const response = await fetch(url);
    if (!response) throw Error("Fetch error");

    const array = await response.arrayBuffer();
    const data = await worker.parseGrid({info, array, includeData});

    const bounds = new AreaBounds(data.bounds);
    const patch = new Patch(info, this);
    patch.bounds = bounds;

    if (includeData)
      patch.data = data;

    return patch;
  }
}
