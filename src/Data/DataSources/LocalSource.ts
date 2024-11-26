import { Patch } from "../Patch";
import { DataLayer } from "../DataLayer";
import { DataLayerSource, PatchSource } from "../DataSource";

export interface LocalSource extends PatchSource, DataLayerSource {
  storePatch(patch: Patch): Promise<void>;
  storeDataLayer(dataLayer: DataLayer): Promise<void>;
}
