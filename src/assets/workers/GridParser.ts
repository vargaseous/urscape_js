import { parse } from "papaparse";
import { BinaryReader } from "./BinaryReader";
import { getMinMax } from "../../Data/DataUtils";
import { GridData } from "../../Data/GridData";
import { PatchData, PatchDataSection, PatchMetadata } from "../../Data/PatchData";

export type ParseRequest = {
  id: string
  array: ArrayBuffer
}

export type ParseResponse = {
  request: ParseRequest
  data?: PatchData
  error?: Error
}

self.onmessage = async (e: MessageEvent<ParseRequest>) => {
  const request = e.data;
  let response: ParseResponse;

  try {
    response = {
      request: request,
      data: await parseGrid(request.array)
    };
  } catch (e) {
    response = {
      request: request,
      error: e as Error
    };
  }

  self.postMessage(response);
};

export async function parseGrid(array: ArrayBuffer): Promise<GridData> {
  return await parseBIN(array);
}

export async function parseBIN(array: ArrayBuffer): Promise<GridData> {
  const buffer = Buffer.from(array);
  const reader = new BinaryReader(buffer);

  const readHeader = () => {
    if (reader.readUint32() !== 0x600DF00D)
      throw Error("Invalid BIN_TOKEN");

    if (reader.readUint32() !== 0x0000000D)
      throw Error("Invalid BIN_VERSION");

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
    const values = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      values[i] = reader.readFloat();
    }

    return values;
  }

  const readMask = (count: number) => {
    const hasMask = reader.readBoolean()
    if (!hasMask) return new Uint8Array(0);

    const mask = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      mask[i] = reader.readUint8();
    }

    return mask;
  }

  const readDistribution = () => {
    const count = reader.readUint8();
    const distribution = new Uint32Array(count);

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
          values: new Float32Array(values),
          mask: new Uint8Array(mask),
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
