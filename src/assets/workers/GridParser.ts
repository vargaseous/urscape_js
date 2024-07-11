import { parse } from "papaparse";
import { BinaryReader } from "./BinaryReader";
import { getMinMax } from "../../DataLayers/DataUtils";
import { GridData } from "../../DataLayers/GridData";
import { PatchHeader, PatchLevel } from "../../DataLayers/Patch";
import { PatchRequest, PatchResponse } from "../../DataLayers/PatchRequest";
import { PatchDataSection, PatchMetadata } from "../../DataLayers/PatchData";

export async function parseGrid(request: PatchRequest): Promise<PatchResponse> {
  const { url, filename } = request;

  const header = parseHeader(filename);
  if (!header) throw Error("Invalid filename format");

  const data = await parseBIN(url);

  return { request, header, data };
}

export function parseHeader(filename: string): PatchHeader | null {
  const regex = new RegExp("^(.*?)_(.*?)_(.*?)@(.*?)_(.*?)_(.*?)\\..+$");
  const values = regex.exec(filename);

  if (!values) return null;

  const name = values[1];
  const level = values[2] as PatchLevel;
  const site = values[3];
  const patch = parseInt(values[4]);
  const date = new Date(); // TODO

  return {
    level,
    name,
    site,
    patch,
    filename,
    date,
  }
}

export async function parseBIN(url: string): Promise<GridData> {
  const response = await fetch(url);
  if (!response.ok) throw Error(response.statusText);

  const data = await response.arrayBuffer();
  const buffer = Buffer.from(data);

  const reader = new BinaryReader(buffer);

  const readHeader = () => {
    reader.readUint32(); // BIN_TOKEN
    reader.readUint32(); // BIN_VERSION
    const west = reader.readDouble();
    const east = reader.readDouble();
    const north = reader.readDouble();
    const south = reader.readDouble();
    const categoryCount = reader.readInt32();
    const minValue = reader.readFloat();
    const maxValue = reader.readFloat();
    const countX = reader.readInt32();
    const countY = reader.readInt32();
    const units = reader.readString();
    const coloring = reader.readInt8();

    return {
      west,
      east,
      north,
      south,
      categoryCount,
      minValue,
      maxValue,
      countX,
      countY,
      units,
      coloring
    }
  }

  const readMetadata = () => {
    const count = reader.readInt32();
    const metadata: PatchMetadata = {};

    for (let i = 0; i < count; i++) {
      const key = reader.readString();
      const value = reader.readString();
      metadata[key] = value;
    }

    return metadata;
  }

  const readCategories = (count: number) => {
    const categories: Record<string, number> = {};

    for (let i = 0; i < count; i++) {
      const name = reader.readString();
      const value = reader.readInt32();
      categories[name] = value;
    }

    return categories;
  }

  const readValues = (count: number) => {
    const values = new Array<number>(count);

    for (let i = 0; i < count; i++) {
      values[i] = reader.readFloat();
    }

    return values;
  }

  const readMask = (count: number) => {
    const hasMask = reader.readBoolean()
    if (!hasMask) return [];

    const mask = new Array<number>(count);

    for (let i = 0; i < count; i++) {
      mask[i] = reader.readUint8();
    }

    return mask;
  }

  const readDistribution = () => {
    const count = reader.readUint8();
    const distribution = new Array<number>(count);

    for (let i = 0; i < count; i++) {
      distribution[i] = reader.readUint32();
    }

    return distribution;
  }

  const header = readHeader();
  const metadata = readMetadata();
  readCategories(header.categoryCount);

  const valueCount = header.countX * header.countY;
  const values = readValues(valueCount);
  const mask = readMask(valueCount);

  readDistribution();

  return {
    metadata: metadata,
    bounds: {
      north: header.north,
      east: header.east,
      south: header.south,
      west: header.west,
    },
    values: values,
    mask: mask,
    countX: header.countX,
    countY: header.countY,
    minValue: header.minValue,
    maxValue: header.maxValue,
  };
}

export async function parseCSV(url: string): Promise<GridData> {
  const metadata: PatchMetadata = {};
  const values: number[] = [];
  const mask: number[] = [];
  let section: PatchDataSection | null = null;

  function parseRow(row: [string, string]) {
    const [key, value] = row;

    if (key == "METADATA") {
      section = value == "TRUE"
        ? PatchDataSection.Metadata
        : section;
      return;
    }
    else if (key == "CATEGORIES") {
      section = value == "TRUE"
        ? PatchDataSection.Categories
        : section;
      return;
    }
    else if (key == "VALUE" && value == "MASK") {
      section = PatchDataSection.Values
      return;
    }

    switch (section) {
      case PatchDataSection.Metadata:
        metadata[key] = value;
        break;
      case PatchDataSection.Categories:
        throw Error("Not implemented");
      case PatchDataSection.Values:
        values.push(parseFloat(key));
        mask.push(parseFloat(value));
        break;
    }
  }

  return new Promise((resolve, reject) => {
    parse(url, {
      download: true,
      skipEmptyLines: true,
      step: function(row) {
        parseRow(row.data as [string, string]);
      },
      complete: function() {
        const [min, max] = getMinMax(values);
        resolve({
          metadata,
          bounds: {
            north: parseFloat(metadata["North"]),
            east: parseFloat(metadata["East"]),
            south: parseFloat(metadata["South"]),
            west: parseFloat(metadata["West"]),
          },
          values, mask,
          countX: parseInt(metadata["Count X"]),
          countY: parseInt(metadata["Count Y"]),
          minValue: min,
          maxValue: max,
        });
      },
      error: function(error) {
        reject(error);
      }
    });
  })
}

self.onmessage = async (e: MessageEvent<PatchRequest>) => {
  const request = e.data;
  const response = await parseGrid(request);
  self.postMessage(response);
};
