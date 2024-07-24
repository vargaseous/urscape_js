export type PatchBounds = {
  north: number;
  east: number;
  south: number;
  west: number;
}

export type PatchMetadata = {
  [key: string]: string;
};

export enum PatchDataSection {
  Metadata = "METADATA",
  Categories = "CATEGORIES",
  Values = "VALUES"
}

export interface PatchData {
  metadata: PatchMetadata;
  bounds: PatchBounds;
  minValue: number;
  maxValue: number;
}
