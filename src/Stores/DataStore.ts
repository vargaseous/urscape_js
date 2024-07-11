import { makeAutoObservable, reaction } from "mobx";
import { Color } from "../Map/Color";
import { RootStore } from "./RootStore";
import { PatchStore } from "./PatchStore";
import { Patch } from "../DataLayers/Patch";
import { Site } from "../DataLayers/Site";
import { DataLayer } from "../DataLayers/DataLayer";
import { patchRequest } from "../DataLayers/PatchRequest";

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
    const site = new Site("World");
    site.selected = true;
    this.sites.push(site);

    const density = new DataLayer(site, "PopulationDensity", Color.red);
    const cropland = new DataLayer(site, "Cropland", Color.green);
    site.layers.push(density, cropland);

    for (let i = 0; i < 32; i++) {
      this.patchStore.requestPatch(patchRequest(cropland.id, `global/Cropland_B_World@${i}_12_grid.bin`));
    }

    for (let i = 0; i < 23; i++) {
      this.patchStore.requestPatch(patchRequest(density.id, `global/Density_B_World@${i}_15_grid.bin`));
    }

    const siteSingapore = new Site("Singapore");
    this.sites.push(siteSingapore);
    const agriculture = new DataLayer(siteSingapore, "BuidtUp", Color.darkYellow);
    const density2 = new DataLayer(siteSingapore, "Density Population", Color.red);
    const gardens = new DataLayer(siteSingapore, "Commity Gardens", Color.green);
    site.layers.push(agriculture,density2,gardens);
    this.patchStore.requestPatch(patchRequest(agriculture.id, `Singapore/BuiltUp_D_Singapore@0_2020_grid.bin`));
    this.patchStore.requestPatch(patchRequest(density2.id, `Singapore/Density_D_Singapore@0_2020_grid.bin`));
    this.patchStore.requestPatch(patchRequest(gardens.id, `Singapore/CommunityGardens_D_Singapore@0_2022_grid.bin`));
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
    patch.layer.patches.push(patch);

    if (patch.data) {
      patch.layer.site.bounds.add(patch.data.bounds);
    }

    this.rootStore.mapStore.updateMapLayers();
  }
}
