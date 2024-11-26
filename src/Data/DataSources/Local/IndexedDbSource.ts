import { LocalSource } from "../LocalSource";
import { DataStore } from "../../../Stores/DataStore";
import { PatchInfo, Patch, PatchObject } from "../../Patch";
import { DataLayer, DataLayerObject } from "../../DataLayer";

/*
  TODO: Move IndexedDbSource class (or all DataSources) to a Web Worker.

  This will allow the main thread to continue working while
  the database operations are performed in the background.
*/

enum IndexedDbNames {
  PatchInfo = "patchInfo",
  PatchData = "patchData",
  DataLayers = "dataLayers",
}

export class IndexedDbSource implements LocalSource {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("IndexedDbSource", 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IndexedDbNames.PatchInfo)) {
          db.createObjectStore(IndexedDbNames.PatchInfo);
        }
        if (!db.objectStoreNames.contains(IndexedDbNames.PatchData)) {
          db.createObjectStore(IndexedDbNames.PatchData);
        }
        if (!db.objectStoreNames.contains(IndexedDbNames.DataLayers)) {
          db.createObjectStore(IndexedDbNames.DataLayers);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async checkAvailability(): Promise<boolean> {
    return await this.dbPromise
      .then(() => true)
      .catch(() => false);
  }

  public async storePatch(patch: Patch): Promise<void> {
    const db = await this.dbPromise;
    const patchObject = patch.toObject();

    const infoTransaction = db.transaction(IndexedDbNames.PatchInfo, "readwrite");
    const infoStore = infoTransaction.objectStore(IndexedDbNames.PatchInfo);
    const infoRequest = infoStore.put(patch.info, patch.info.filename);

    await new Promise<IDBValidKey>((resolve, reject) => {
      infoRequest.onsuccess = () => resolve(infoRequest.result);
      infoRequest.onerror = () => reject(infoRequest.error);
    });

    const dataTransaction = db.transaction(IndexedDbNames.PatchData, "readwrite");
    const dataStore = dataTransaction.objectStore(IndexedDbNames.PatchData);
    const dataRequest = dataStore.put(patchObject, patchObject.info.filename);

    await new Promise<IDBValidKey>((resolve, reject) => {
      dataRequest.onsuccess = () => resolve(dataRequest.result);
      dataRequest.onerror = () => reject(dataRequest.error);
    });
  }

  public async getAvailablePatches(): Promise<PatchInfo[]> {
    const db = await this.dbPromise;

    const dbTransaction = db.transaction(IndexedDbNames.PatchInfo, "readonly");
    const objectStore = dbTransaction.objectStore(IndexedDbNames.PatchInfo);

    const request = objectStore.getAll();
    const info = await new Promise<PatchInfo[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return info;
  }

  public async getPatch(info: PatchInfo): Promise<Patch | undefined> {
    const db = await this.dbPromise;

    const dbTransaction = db.transaction(IndexedDbNames.PatchData, "readonly");
    const objectStore = dbTransaction.objectStore(IndexedDbNames.PatchData);

    const request = objectStore.get(info.filename);
    const patchObject = await new Promise<PatchObject>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return Patch.fromObject(this, patchObject);
  }

  public async storeDataLayer(dataLayer: DataLayer): Promise<void> {
    const db = await this.dbPromise;

    const dbTransaction = db.transaction(IndexedDbNames.DataLayers, "readwrite");
    const objectStore = dbTransaction.objectStore(IndexedDbNames.DataLayers);

    const dataLayerObject = dataLayer.toObject();
    const request = objectStore.put(dataLayerObject, dataLayer.id);

    await new Promise<IDBValidKey>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async getDataLayers(dataStore: DataStore): Promise<DataLayer[]> {
    const db = await this.dbPromise;

    const dbTransaction = db.transaction(IndexedDbNames.DataLayers, "readonly");
    const objectStore = dbTransaction.objectStore(IndexedDbNames.DataLayers);

    const request = objectStore.getAll();
    const layers = await new Promise<DataLayerObject[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return layers.map(layer => DataLayer.fromObject(dataStore, layer));
  }
}
