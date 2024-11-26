import { makeAutoObservable, runInAction } from "mobx";
import { DataStore } from "./DataStore";
import { Patch, PatchInfo } from "../Data/Patch";
import { PatchSource } from "../Data/DataSource";
import { LocalSource } from "../Data/DataSources/LocalSource";

export class PatchStore {
  public dataStore: DataStore
  public requests: Set<string>;
  public loading: boolean;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
    this.requests = new Set();
    this.loading = false;

    makeAutoObservable(this, {
      request: false,
      requests: false
    });
  }

  public async init() {
    this.loading = true;

    const sources = this.dataStore.sources
      .map(source => source as PatchSource)
      .filter(source => source !== undefined);

    await this.preloadAll(sources);
    await this.loadAll(sources);

    runInAction(() => this.loading = false);
  }

  public async request(source: PatchSource, info: PatchInfo) {
    if (this.requests.has(info.filename)) return;
    this.requests.add(info.filename);

    try {
      const patch = await source.getPatch(info, true);
      if (!patch) throw Error("Patch not found");
      this.dataStore.pushPatch(patch);
    } catch (e) {
      console.error(e);
    } finally {
      this.requests.delete(info.filename);
    }
  }

  public async store(patch: Patch) {
    const localSource = this.dataStore.sources
      .map(source => source as LocalSource)
      .filter(source => source !== undefined)
      .find(async source => await source.checkAvailability());

    if (!localSource)
      throw Error("No local source available");

    patch.source = localSource;
    await localSource.storePatch(patch);
  }

  public async load(source: PatchSource) {
    const dataStore = this.dataStore;
    const patchInfos = await source.getAvailablePatches();

    for (const info of patchInfos) {
      const patch = await source.getPatch(info, false);
      if (!patch) throw Error("Patch not found");

      dataStore.pushPatch(patch);
    }
  }

  public async preload(source: PatchSource) {
    const patchInfos = await source.getAvailablePatches();

    for (const info of patchInfos) {
      const dataLayer = this.dataStore.getDataLayer(info);
      dataLayer.pushPatch(new Patch(info, source));
    }
  }

  public async loadAll(sources: PatchSource[]) {
    await Promise.all(sources.map(source => this.load(source)));
  }

  public async preloadAll(sources: PatchSource[]) {
    await Promise.all(sources.map(source => this.preload(source)));
  }
}
