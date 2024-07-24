import { makeAutoObservable, observable } from "mobx";
import { RootStore } from "./RootStore";
import { MapCache } from "./MapCache";
import { MapLayer } from "../Map/MapLayer";
import { GridLayer } from "../Map/GridLayer";
import { GridPatch } from "../Data/GridPatch";
import { AreaBounds } from "../Data/DataUtils";
import { MapState } from "../Map/MapState";
import { getPatchLevel } from "../Map/MapUtils";

export class MapStore {
  public rootStore: RootStore
  public mapLayers: Map<string, MapLayer>
  public mapCache: MapCache
  public mapState: MapState

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.mapLayers = new Map();
    this.mapCache = new MapCache(100);
    this.mapState = {
      bounds: AreaBounds.inf(),
      zoom: 0
    };

    makeAutoObservable(this, {
      mapLayers: observable.shallow,
      mapCache: false
    });
  }

  public async updateMapState(state: MapState) {
    this.mapState = state;
    this.updateMapLayers();
  }

  public updateMapLayers() {
    const dataStore = this.rootStore.dataStore;
    const dataLayers = dataStore.dataLayers;
    const level = getPatchLevel(this.mapState.zoom);

    const activeDataLayers = dataLayers
      .filter(layer => layer.active);

    const visiblePatches = activeDataLayers
      .flatMap(layer => layer.patches.getArea(this.mapState.bounds, level))

    // Hide inactive maplayers
    for (const mapLayer of this.mapLayers.values()) {
      const patch = mapLayer.patch;
      if (!mapLayer.dataLayer.active || !visiblePatches.includes(patch)) {
        // Store inactive layers in cache
        mapLayer.active = false;
        this.mapCache.set(patch.id, mapLayer);
        this.mapLayers.delete(patch.id);
      }
    }

    let offsetIndex = 0;
    const offCenter = 0.18;

    const offsetCount = 1.0 / activeDataLayers.length;
    const offsetRadians = (2.0 * Math.PI) * offsetCount;
    const offsetDistance = offCenter * (1.0 - offsetCount);

    for (const dataLayer of activeDataLayers) {
      const index = offsetIndex++;
      const visiblePatches = dataLayer.patches
        .getArea(this.mapState.bounds, level) as GridPatch[];

      for (const patch of visiblePatches) {
        const { id, data } = patch;

        if (!data) {
          dataStore.patchStore.request(patch.source, patch.info);
          continue;
        }

        let layer = this.mapLayers.get(id) as GridLayer;

        // Fetch layer from cache
        if (!layer && this.mapCache.has(id)) {
          layer = this.mapCache.get(id) as GridLayer;
          this.mapLayers.set(id, layer);
        }

        // otherwise create new layer
        else if (!layer) {
          layer = new GridLayer(id, dataLayer, patch);
          this.mapLayers.set(id, layer);
        }

        layer.active = true;
        layer.offset = [
          offsetDistance * Math.cos(index * offsetRadians),
          offsetDistance * Math.sin(index * offsetRadians)
        ];
      }
    }
  }
}
