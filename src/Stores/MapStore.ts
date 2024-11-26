import { makeAutoObservable, observable } from "mobx";
import { eventBus } from "../EventBus";
import { RootStore } from "./RootStore";
import { MapCache } from "../Map/MapCache";
import { MapLayer } from "../Map/MapLayer";
import { createMapState, MapState } from "../Map/MapState";
import { MapController } from "../Map/MapController";
import { GridController } from "../Map/Controllers/GridController";
import { ContoursController } from "../Map/Controllers/ContoursController";

export class MapStore {
  public rootStore: RootStore
  public mapLayers: Map<string, MapLayer>
  public mapCache: MapCache
  public mapState: MapState
  public mapControllers: MapController[]

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.mapLayers = new Map();
    this.mapCache = new MapCache(100);
    this.mapState = createMapState();
    this.mapControllers = [
      new GridController(this),
      new ContoursController(this)
    ];

    makeAutoObservable(this, {
      mapLayers: observable.shallow,
      mapCache: false,
    });
  }

  public async updateMapState(state: MapState) {
    this.mapState = state;
    this.mapUpdate();
  }

  public mapUpdate() {
    for (const controller of this.mapControllers)
      controller.onMapUpdate?.();

    eventBus.emit("mapUpdate");
  }

  public mapRedraw() {
    for (const controller of this.mapControllers)
      controller.onMapRedraw?.();

    eventBus.emit("mapRedraw");
  }
}
