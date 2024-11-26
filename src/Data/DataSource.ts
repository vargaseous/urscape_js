import { DataLayer } from "./DataLayer";
import { DataStore } from "../Stores/DataStore";
import { Patch, PatchInfo, PatchLevel } from "./Patch";
import { StaticSource } from "./DataSources/StaticSource";
import { InMemorySource } from "./DataSources/Local/InMemorySource";
import { IndexedDbSource } from "./DataSources/Local/IndexedDbSource";

export interface DataSource {
  checkAvailability(): Promise<boolean>
}

export interface PatchSource extends DataSource {
  getAvailablePatches(): Promise<PatchInfo[]>
  getPatch(info: PatchInfo, includeData: boolean): Promise<Patch | undefined>
}

export interface DataLayerSource extends DataSource{
  getDataLayers(dataStore: DataStore): Promise<DataLayer[]>
}

export async function getDataSources(): Promise<DataSource[]> {
  return [
    new IndexedDbSource(),
    new InMemorySource(),
    new StaticSource()
  ];
}

export function parseInfo(filename: string): PatchInfo | null {
  const regex = new RegExp("^(.*?)_(.*?)_(.*?)@(.*?)_(.*?)_(.*?)\\..+$");
  const values = regex.exec(filename);

  if (!values) return null;

  const name = values[1];
  const level = PatchLevel[values[2] as keyof typeof PatchLevel];
  const site = values[3];
  const patch = parseInt(values[4]);
  const date =  parseInt(values[5]);

  return {
    level,
    name,
    site,
    index: patch,
    filename,
    date,
  }
}
