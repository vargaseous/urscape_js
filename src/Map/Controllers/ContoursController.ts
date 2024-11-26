import { makeAutoObservable } from "mobx";
import { MapController } from "../MapController";
import { MapStore } from "../../Stores/MapStore";
import { GridLayer } from "../Layers/GridLayer";
import { ContoursLayer } from "../Layers/ContoursLayer";
import { equalSets } from "../../Utils";

export class ContoursController implements MapController {
  public active = false;
  public mapStore: MapStore;

  constructor(mapStore: MapStore) {
    this.mapStore = mapStore;

    makeAutoObservable(this);
  }

  public setActive(active: boolean) {
    this.active = active;
    this.mapStore.mapUpdate();
  }

  public onMapUpdate() {
    const mapLayers = this.mapStore.mapLayers;

    const gridLayers = Array.from(mapLayers.values())
      .filter(layer => layer instanceof GridLayer) as GridLayer[];

    const contoursLayer = mapLayers.get("contours") as ContoursLayer;

    if (!this.active || gridLayers.length === 0) {
      mapLayers.delete("contours");
      return;
    }

    const grids = gridLayers
      .map(layer => layer.patch)
      .filter(layer => layer.data);

    if (!contoursLayer) {
      mapLayers.set("contours", new ContoursLayer(grids));
      return;
    }

    const contoursPatches = new Set(contoursLayer.patches);
    const contoursDataLayers = new Set(contoursLayer.patches.map(patch => patch.dataLayer!));
    const dataLayers = new Set(grids.map(patch => patch.dataLayer!));

    const newPatches = grids
      .some(patch => !contoursPatches.has(patch));

    const sameDataLayers = equalSets(contoursDataLayers, dataLayers);

    if (newPatches || !sameDataLayers) {
      mapLayers.set("contours", new ContoursLayer(grids));
    }
  }

  public onMapRedraw() {
    const mapLayers = this.mapStore.mapLayers;
    const contoursLayer = mapLayers.get("contours") as ContoursLayer;

    if (contoursLayer) {
      contoursLayer.recalculateContours();
    }
  }
}
