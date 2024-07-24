import { makeAutoObservable } from "mobx";
import { DataStore } from "./DataStore";
import { DataSource } from "../Data/DataSource";
import { StaticSource } from "../Data/DataSources/StaticSource";
import { LocalSource } from "../Data/DataSources/LocalSource";
import { PatchInfo } from "../Data/Patch";

export class PatchStore {
  public dataStore: DataStore
  public sources: DataSource[];
  public requests: Set<string>;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
    this.sources = [new LocalSource(), new StaticSource()];
    this.requests = new Set();
    makeAutoObservable(this);
  }

  public async request(source: DataSource, info: PatchInfo) {
    if (this.requests.has(info.filename)) return;
    this.requests.add(info.filename);

    try {
      const patch = await source.getPatch(info);
      this.dataStore.pushPatch(patch);
    } catch (e) {
      console.error(e);
    } finally {
      this.requests.delete(info.filename);
    }
  }

  public async load(source: DataSource) {
    const dataStore = this.dataStore;
    const patchInfos = await source.getAvailablePatches();

    for (const info of patchInfos) {
      const patch = await source.getPatch(info);
      delete patch.data; // Load without data to save memory
      dataStore.pushPatch(patch);
    }
  }

  public loadAll() {
    return Promise.all(this.sources.map(source => this.load(source)));
  }
}
