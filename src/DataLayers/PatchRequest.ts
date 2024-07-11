import { v4 as uuid } from "uuid";
import { PatchConstants, PatchHeader } from "./Patch";
import { PatchData } from "./PatchData";

export type PatchRequest = {
  id: string;
  url: string;
  layerId: string;
  filename: string;
  published: boolean;
}

export type PatchResponse = {
  header: PatchHeader
  data: PatchData
  request: PatchRequest
}

export function patchRequest(layerId: string, path: string) {
  const base = window.location.origin + import.meta.env.BASE_URL;
  const filename = path.substring(path.lastIndexOf('/') + 1);
  const url = new URL(PatchConstants.PATCH_PATH + path, base).href;

  return {
    id: uuid(),
    url: url,
    layerId: layerId,
    filename: filename,
    published: false
  };
}
