import { Patch, PatchInfo } from "./Patch";

export interface DataSource {
  getAvailablePatches(): Promise<PatchInfo[]>
  getPatch(info: PatchInfo): Promise<Patch>
}
