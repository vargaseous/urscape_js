import { LocalSource } from "../LocalSource";
import { Patch, PatchInfo } from "../../Patch";
import { DataStore } from "../../../Stores/DataStore";
import { DataLayer, DataLayerObject } from "../../DataLayer";

export class InMemorySource implements LocalSource {
  private patches: Map<string, Patch>;
  private dataLayers: Map<string, DataLayerObject>;

  constructor() {
    this.patches = new Map();
    this.dataLayers = new Map();
  }

  public async storePatch(patch: Patch): Promise<void> {
    this.patches.set(patch.info.filename, patch);
  }

  public async checkAvailability(): Promise<boolean> {
    return true;
  }

  public async getAvailablePatches(): Promise<PatchInfo[]> {
    return Array.from(this.patches.values()).map(value => value.info);
  }

  public async getPatch(info: PatchInfo): Promise<Patch | undefined> {
    return this.patches.get(info.filename);
  }

  public async storeDataLayer(dataLayer: DataLayer): Promise<void> {
    const dataLayerObject = dataLayer.toObject();
    this.dataLayers.set(dataLayer.id, dataLayerObject);
  }

  public async getDataLayers(dataStore: DataStore): Promise<DataLayer[]> {
    return Array.from(this.dataLayers)
      .map(value => value[1])
      .map(layer => DataLayer.fromObject(dataStore, layer));
  }
}
