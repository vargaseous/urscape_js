import { makeAutoObservable } from "mobx";
import { RootStore } from "./RootStore";
import { MapLayer } from "../Map/MapLayer";
import { GridLayer } from "../Map/GridLayer";
import { GridPatch } from "../DataLayers/GridPatch";

export class MapStore {
  public rootStore: RootStore
  public mapLayers: Map<string, MapLayer>

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.mapLayers = new Map();
    makeAutoObservable(this);
  }

  public addMapLayer(mapLayer: MapLayer) {
    this.mapLayers.set(mapLayer.id, mapLayer);
  }

  public removeMapLayer(mapLayer: MapLayer) {
    this.mapLayers.delete(mapLayer.id);
  }

  public updateMapLayers() {
    const dataStore = this.rootStore.dataStore;
    const dataLayers = dataStore.dataLayers;

    // Remove inactive maplayers
    for (const mapLayer of this.mapLayers.values()) {
      const gridLayer = mapLayer as GridLayer;
      if (!gridLayer.dataLayer.active) {
        this.removeMapLayer(mapLayer);
      }
    }

    const activeDataLayers = dataLayers
      .filter(layer => layer.active);

    let offsetIndex = 0;
    const offCenter = 0.18;

    const offsetCount = 1.0 / activeDataLayers.length;
    const offsetRadians = (2.0 * Math.PI) * offsetCount;
    const offsetDistance = offCenter * (1.0 - offsetCount);

    for (const dataLayer of activeDataLayers) {
      const index = offsetIndex++;
      const patches = dataLayer.patches as GridPatch[];

      for (const patch of patches) {
        const { header, data } = patch;

        if (!data) {
          // TODO: Request patch data
          console.warn("Patch has no data");
          continue;
        }

        const id = header.name + header.patch;
        let layer = this.mapLayers.get(id) as GridLayer;

        if (!layer) {
          layer = new GridLayer(id, dataLayer, data);
          this.addMapLayer(layer);
        }

        layer.offset = [
          offsetDistance * Math.cos(index * offsetRadians),
          offsetDistance * Math.sin(index * offsetRadians)
        ];
      }
    }
  }
}
