import { makeAutoObservable } from "mobx";
import { RootStore } from "./RootStore";
import { PatchStore } from "./PatchStore";
import { Site } from "../Data/Site";
import { Color } from "../Map/Color";
import { DataLayer } from "../Data/DataLayer";
import { Patch, PatchInfo } from "../Data/Patch";
import { LocalSource } from "../Data/DataSources/LocalSource";
import { DataLayerSource, DataSource, getDataSources } from "../Data/DataSource";

export class DataStore {
  public rootStore: RootStore
  public patchStore: PatchStore
  public sources: DataSource[];
  public sites: Site[]

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.patchStore = new PatchStore(this);
    this.sources = [];
    this.sites = [];

    makeAutoObservable(this, {
      getDataLayer: false
    });
  }

  public get dataLayers() {
    return this.sites.flatMap(x => x.layers);
  }

  public async init() {
    const world = new Site("World");
    world.selected = true;
    this.sites.push(world);

    await this.load();
    this.patchStore.init();
  }

  public async load() {
    this.sources = await getDataSources();

    const sources = this.sources
      .map(source => source as DataLayerSource)
      .filter(source => source.getDataLayers !== undefined);

    for (const source of sources) {
      const layers = await source.getDataLayers(this);

      for (const layer of layers) {
        this.addDataLayer(layer);
      }
    }
  }

  public addSite(site: Site) {
    this.sites.push(site);
  }

  public selectSite(site: Site) {
    this.sites.forEach(x => x.selected = false);
    site.selected = true;
  }

  public addDataLayer(dataLayer: DataLayer) {
    dataLayer.site.layers.push(dataLayer);
  }

  public pushPatch(patch: Patch) {
    const dataLayer = this.getDataLayer(patch.info);
    dataLayer.pushPatch(patch);
    this.rootStore.mapStore.mapUpdate();
  }

  public getDataLayer(info: PatchInfo) {
    let dataLayer = this.dataLayers.find(layer =>
      layer.name == info.name && layer.site.name == info.site);

    if (!dataLayer) {
      let site = this.sites.find(site => site.name == info.site);

      if (!site) {
        site = new Site(info.site);
        this.addSite(site);
      }

      dataLayer = new DataLayer(
        this,
        site,
        info.name,
        Color.random()
      );

      this.addDataLayer(dataLayer);
    }

    return dataLayer;
  }

  public async saveDataLayer(dataLayer: DataLayer) {
    const localSource = this.sources
      .map(source => source as LocalSource)
      .filter(source => source !== undefined)
      .find(async source => await source.checkAvailability());

    if (!localSource)
      throw Error("No local source available");

    await localSource.storeDataLayer(dataLayer);
  }
}
