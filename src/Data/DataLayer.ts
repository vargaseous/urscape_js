import { makeAutoObservable, reaction, toJS } from "mobx"
import { v7 as uuid } from "uuid";
import { Site } from "./Site";
import { Color, ColorLike } from "../Map/Color";
import { Patch } from "./Patch";
import { DataStore } from "../Stores/DataStore";
import { GridLayer } from "../Map/Layers/GridLayer";
import { PatchTree, ObservablePatchTree } from "./PatchTree";
import { getPatchLevel } from "../Map/MapUtils";
// import { PatchData, PatchMetadata } from "./PatchData";

export type DataLayerObject = ReturnType<DataLayer["toObject"]>;

export interface DataLayerMetadata {
  displayName: string;
  units?:string;
  source?: string;
  extent?:string;
  date?: string;
}

export class DataLayer {
  public store: DataStore;
  public site: Site;
  public id: string;
  public name: string;
  public tint: Color;
  public metadata: DataLayerMetadata;
  public patches: PatchTree;
  public minmax: [number, number];
  public filter: [number, number];
  public selected: boolean;
  public filtered: boolean;
  public colored: boolean;
  public expanded: boolean;
  public informed: boolean;
  private lastToggled: 'filter' | 'color' | 'info' | null = null;

  constructor(store: DataStore, site: Site, name: string, tint: Color) {
    this.store = store;

    this.site = site;
    this.id = uuid();
    this.name = name;
    this.tint = tint;

    this.metadata = {
      displayName: name
    }

    this.patches = new ObservablePatchTree();
    this.minmax = [0, 0];
    this.filter = [0, 1];

    this.selected = false;
    this.filtered = false;
    this.colored = false;
    this.expanded = false;
    this.informed = false;

    makeAutoObservable(this, {
      toObject: false
    });

    reaction(
      () => this.active,
      () => this.store.rootStore.mapStore.mapUpdate(),
      { "name": "dataLayerUpdate" }
    );

    reaction(
      () => [this.filtered, this.filter, this.tint],
      () => this.store.rootStore.mapStore.mapRedraw(),
      { "name": "dataLayerRedraw" }
    );
  }

  public get active(): boolean {
    return !this.hidden && this.selected;
  }

  public get hidden(): boolean {
    return !this.site.selected;
  }

  public get loaded(): boolean {
    const loadedPatches = this.patches.values();
    const preloadedPatches = this.patches.values()
      .filter(patch => patch.bounds);

    if (loadedPatches.length !== preloadedPatches.length)
      return false;

    if (!this.active) return true;

    const mapState = this.store.rootStore.mapStore.mapState;
    const level = getPatchLevel(mapState.zoom);
    const visiblePatches = this.patches.getArea(mapState.bounds, level);
    const mapLayers = Array.from(this.store.rootStore.mapStore.mapLayers.values());

    const mapPatches = mapLayers
      .filter(layer => layer instanceof GridLayer)
      .map(layer => layer as GridLayer)
      .filter(layer =>
        layer.patch.data &&
        layer.active &&
        layer.dataLayer == this);

    return mapPatches.length == visiblePatches.length;
  }

  public pushPatch(patch: Patch) {
    patch.dataLayer = this;
    this.patches.push(patch);

    if (patch.data)
    {
      this.recalculateMinMax();
      this.metadata = {
        displayName: patch.data.metadata.displayName,
        units: patch.data.metadata.units,
        source: patch.data.metadata.source,
        date: patch.info.date.toString(),
        extent : patch.data.bounds.east + 
        "," + patch.data.bounds.south + 
        "," + patch.data.bounds.west + 
        "," + patch.data.bounds.north,
      }
    }
    if (patch.bounds)
      this.site.bounds.add(patch.bounds);
  }

  public setFilter(min: number, max: number) {

    this.filter = [min, max];
    //update patch tree

    
  }

  public toggleSelect() {
    this.selected = !this.selected;
  }

  public toggleFilter() {

    if (this.lastToggled === 'filter') {
      // Clicking the same button again
      this.expanded = false; // Collapse panel
      this.filtered = false;
      this.lastToggled = null; // Reset last toggled
    } else {
      // Clicking a different button or first time
      this.expanded = true; // Keep panel expanded
      this.filtered = true;
      this.colored = false;
      this.informed = false;
      this.lastToggled = 'filter';
    }
  }

  public toggleColor() {

    if (this.lastToggled === 'color') {
      // Clicking the same button again
      this.expanded = false; // Collapse panel
      this.colored = false;
      this.lastToggled = null; // Reset last toggled
    } else {
      // Clicking a different button or first time
      this.expanded = true; // Keep panel expanded
      this.informed= false;
      this.filtered = false;
      this.colored = true;
      this.lastToggled = 'color';
  }
  }
  public toggleInfo() {

    if (this.lastToggled === 'info') {
      // Clicking the same button again
      this.expanded = false; // Collapse panel
      this.informed = false;
      this.lastToggled = null; // Reset last toggled
    } else {
      // Clicking a different button or first time
      this.expanded = true; // Keep panel expanded
      this.colored = false;
      this.filtered = false;
      this.informed = true;
      this.lastToggled = 'info';
    }
  }

  public setTint(color: Color) {
    this.tint = color;
    this.store.saveDataLayer(this);
  }

  public setMetadata(metadata: DataLayerMetadata) {
    this.metadata = metadata;
    this.store.saveDataLayer(this);
  }

  public recalculateMinMax() {
    let min = +Infinity;
    let max = -Infinity;

    for (const patch of this.patches.values()) {
      if (!patch.data) continue;
      min = patch.data.minValue < min ? patch.data.minValue : min;
      max = patch.data.maxValue > max ? patch.data.maxValue : max;
    }

    this.minmax = [min, max];
  }

  public toObject() {
    return {
      id: this.id,
      name: this.name,
      site: this.site.name,
      tint: this.tint as ColorLike,
      metadata: toJS(this.metadata),
    }
  }

  public static fromObject(dataStore: DataStore, object: DataLayerObject) {
    let site = dataStore.sites.find(site => site.name == object.site);

    if (!site) {
      site = new Site(object.site);
      dataStore.addSite(site);
    }

    const { r, g, b, a } = object.tint;

    const layer = new DataLayer(
      dataStore,
      site,
      object.name,
      new Color(r, g, b, a)
    );

    layer.id = object.id;
    layer.metadata = object.metadata;

    return layer;
  }
}
