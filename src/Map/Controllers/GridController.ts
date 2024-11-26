import { makeAutoObservable } from "mobx";
import { MapController } from "../MapController";
import { MapStore } from "../../Stores/MapStore";
import { GridPatch } from "../../Data/GridPatch";
import { GridLayer } from "../Layers/GridLayer";
import { getPatchLevel } from "../MapUtils";

export class GridController implements MapController {
  public active = true;
  public mapStore: MapStore;
  public oldGridLayers: GridLayer[];

  constructor(mapStore: MapStore) {
    this.mapStore = mapStore;
    this.oldGridLayers = [];

    makeAutoObservable(this);
  }

  public setActive(active: boolean) {
    this.active = active;
  }

  public onMapUpdate() {
    const { mapLayers, mapCache, mapState } = this.mapStore;
    const { patchStore, dataLayers } = this.mapStore.rootStore.dataStore;

    const level = getPatchLevel(mapState.zoom);

    const activeDataLayers = dataLayers
      .filter(layer => layer.active);

    const visiblePatches = activeDataLayers
      .flatMap(layer => layer.patches.getArea(mapState.bounds, level))

    // Hide inactive maplayers
    for (const mapLayer of mapLayers.values()) {
      if (mapLayer instanceof GridLayer) {
        const patch = mapLayer.patch;
        if (!mapLayer.dataLayer.active || !visiblePatches.includes(patch)) {
          // Store inactive layers in cache
          mapLayer.active = false;
          mapCache.set(patch.id, mapLayer);
          mapLayers.delete(patch.id);
        }
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
        .getArea(mapState.bounds, level) as GridPatch[];

      for (const patch of visiblePatches) {
        const { id, data } = patch;

        if (!data && patch.source) {
          patchStore.request(patch.source, patch.info);
          continue;
        }

        let layer = mapLayers.get(id) as GridLayer;

        // Fetch layer from cache
        if (!layer && mapCache.has(id)) {
          layer = mapCache.get(id) as GridLayer;
          mapLayers.set(id, layer);
        }

        // otherwise create new layer
        else if (!layer) {
          layer = new GridLayer(dataLayer, patch);
          mapLayers.set(id, layer);
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
