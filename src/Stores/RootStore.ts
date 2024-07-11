import { createContext, useContext } from "react";
import { makeAutoObservable } from "mobx";
import { DataStore } from "./DataStore";
import { MapStore } from "./MapStore";

export class RootStore {
  public mapStore: MapStore
  public dataStore: DataStore

  constructor() {
    this.mapStore = new MapStore(this);
    this.dataStore = new DataStore(this);
    this.dataStore.init();
    makeAutoObservable(this);
  }
}

export const store = new RootStore();

export const StoreContext = createContext<RootStore>(store);
export const StoreProvider = StoreContext.Provider;

export const useStore = (): RootStore => useContext(StoreContext);
