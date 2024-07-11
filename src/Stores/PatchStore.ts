import { makeAutoObservable, observable } from "mobx";
import { DataStore } from "./DataStore";
import { PatchRequest, PatchResponse } from "../DataLayers/PatchRequest";

export class PatchStore {
  public dataStore: DataStore
  public patchRequests: Map<string, PatchRequest>

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
    this.patchRequests = new Map();

    makeAutoObservable(this, {
      patchRequests: observable.shallow
    });
  }

  public requestPatch(request: PatchRequest) {
    this.patchRequests.set(request.id, request);
  }

  public completePatchRequest(response: PatchResponse) {
    const { request, header, data } = response;
    this.patchRequests.delete(request.id);

    const dataLayer = this.dataStore.dataLayers
      .find(x => x.id == request.layerId);

    if (!dataLayer) {
      console.warn("DataLayer was disposed before Patch request completed")
      return;
    }

    const patch = {
      layer: dataLayer,
      header: header,
      data: data,
    }

    this.dataStore.pushPatch(patch);
  }
}
