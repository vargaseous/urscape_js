import { DataSource } from "../DataSource";
import { AreaBounds } from "../DataUtils";
import { parseGrid } from "../../Workers";
import { Patch, PatchConstants, PatchInfo, PatchLevel } from "../Patch";

export class StaticSource implements DataSource {
  private patchPaths: string[]

  constructor() {
    this.patchPaths = [];

    for (let i = 0; i < 32; i++) {
      this.patchPaths.push(`global/Cropland_B_World@${i}_12_grid.bin`);
    }

    for (let i = 0; i < 23; i++) {
      this.patchPaths.push(`global/Density_B_World@${i}_15_grid.bin`);
    }

    this.patchPaths.push(`Singapore/BuiltUp_D_Singapore@0_2020_grid.bin`);
    this.patchPaths.push(`Singapore/Density_D_Singapore@0_2020_grid.bin`);
    this.patchPaths.push(`Singapore/CommunityGardens_D_Singapore@0_2022_grid.bin`);
  }

  public async getAvailablePatches(): Promise<PatchInfo[]> {
    return this.patchPaths.map(path => {
      const filename = path.substring(path.lastIndexOf('/') + 1);
      const info = parseInfo(filename);
      if (info) return info;
      throw Error("Invalid filename format");
    })
  }

  public async getPatch(info: PatchInfo): Promise<Patch> {
    const path = `${info.site}/${info.filename}`;
    const base = window.location.origin + import.meta.env.BASE_URL;
    const url = new URL(PatchConstants.PATCH_PATH + path, base).href;

    const response = await fetch(url);
    if (!response) throw Error("Fetch error");

    const array = await response.arrayBuffer();
    const data = await parseGrid(array);

    const bounds = new AreaBounds(data.bounds);
    const patch = new Patch(this, info, bounds);
    patch.data = data;

    return patch;
  }
}

export function parseInfo(filename: string): PatchInfo | null {
  const regex = new RegExp("^(.*?)_(.*?)_(.*?)@(.*?)_(.*?)_(.*?)\\..+$");
  const values = regex.exec(filename);

  if (!values) return null;

  const name = values[1];
  const level = PatchLevel[values[2] as keyof typeof PatchLevel];
  const site = values[3];
  const patch = parseInt(values[4]);
  const date = new Date(); // TODO

  return {
    level,
    name,
    site,
    index: patch,
    filename,
    date,
  }
}
