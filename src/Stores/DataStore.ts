import { makeAutoObservable, reaction } from "mobx";
import { Color } from "../Map/Color";
import { RootStore } from "./RootStore";
import { PatchStore } from "./PatchStore";
import { Patch } from "../Data/Patch";
import { Site } from "../Data/Site";
import { DataLayer } from "../Data/DataLayer";

export class DataStore {
  public rootStore: RootStore
  public patchStore: PatchStore
  public sites: Site[]

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.patchStore = new PatchStore(this);
    this.sites = [];

    makeAutoObservable(this);

    // Update maplayers on datalayer toggle
    reaction(
      () => this.dataLayers.map(x => x.active),
      () => this.rootStore.mapStore.updateMapLayers()
    );
  }

  public get dataLayers() {
    return this.sites.flatMap(x => x.layers);
  }

  public init() {
    const world = new Site("World");
    world.selected = true;
    this.sites.push(world);

    const density = new DataLayer(world, "Density", Color.red);
    const cropland = new DataLayer(world, "Cropland", Color.green);
    world.layers.push(density, cropland);

    const singapore = new Site("Singapore");
    this.sites.push(singapore);

    const agriculture = new DataLayer(singapore, "BuiltUp", Color.darkYellow);
    const density2 = new DataLayer(singapore, "Density", Color.red);
    const gardens = new DataLayer(singapore, "CommunityGardens", Color.green);
    singapore.layers.push(agriculture, density2, gardens);

    this.patchStore.loadAll();
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
    let dataLayer = this.dataLayers.find(layer =>
      layer.name == patch.info.name && layer.site.name == patch.info.site);

    if (!dataLayer) {
      let site = this.sites.find(site => site.name == patch.info.site);

      if (!site) {
        site = new Site(patch.info.site);
        this.addSite(site);
      }

      dataLayer = new DataLayer(site, patch.info.name, Color.random());
      this.addDataLayer(dataLayer);
    }

    // TODO: Update active map layers with new patch data
    dataLayer.patches.push(patch);
    dataLayer.site.bounds.add(patch.bounds);

    this.rootStore.mapStore.updateMapLayers();
  }
}
