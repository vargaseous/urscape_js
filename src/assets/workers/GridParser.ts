import { expose } from "comlink";
import { parse } from "papaparse";
import { fromArrayBuffer, TypedArray } from "geotiff";
import { BinaryReader } from "./BinaryReader";
import { getMinMax } from "../../Data/DataUtils";
import { PatchInfo } from "../../Data/Patch";
import { GridData } from "../../Data/GridData";
import { PatchDataSection, PatchMetadata } from "../../Data/PatchData";

export type ParseRequest = {
  info: PatchInfo
  array: ArrayBuffer
  includeData: boolean
}

export interface GridParser {
  parseGrid(request: ParseRequest): Promise<GridData>
  parseTIFF(request: ParseRequest): Promise<GridData>
  parseBIN(request: ParseRequest): Promise<GridData>
  parseCSV(request: ParseRequest): Promise<GridData>
}

const gridParser: GridParser = {
  parseGrid(request: ParseRequest): Promise<GridData> {
    const { info } = request;
    const ext = info.filename.split('.').pop()?.toLowerCase();

    switch (ext) {
      case "tif":
      case "tiff":
        return this.parseTIFF(request);
      case "bin":
        return this.parseBIN(request);
      case "csv":
        return this.parseCSV(request);
      default:
        throw Error("Unsupported file extension: " + ext);
    }
  },

  async parseTIFF(request: ParseRequest): Promise<GridData> {
    const tiff = await fromArrayBuffer(request.array);
    const image = await tiff.getImage();

    const [west, south, east, north] = image.getBoundingBox();

    if (request.includeData) {
      const raster = await image.readRasters({ interleave: true });
      const values = new Float32Array(raster as TypedArray);

      const [min, max] = getMinMax(values);
      const nodata = image.getGDALNoData();

      return {
        metadata: {},
        bounds: {
          north: north,
          east: east,
          south: south,
          west: west,
        },
        values: values,
        mask: nodata,
        countX: image.getWidth(),
        countY: image.getHeight(),
        minValue: min,
        maxValue: max,
      };
    }

    return {
      metadata: {},
      bounds: {
        north: north,
        east: east,
        south: south,
        west: west,
      },
      values: new Float32Array(0),
      mask: null,
      countX: image.getWidth(),
      countY: image.getHeight(),
      minValue: 0,
      maxValue: 0,
    }
  },

  async parseBIN(request: ParseRequest): Promise<GridData> {
    const buffer = Buffer.from(request.array);
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
      const values = buffer.buffer.slice(reader.byteOffset, reader.byteOffset + count * 4);
      reader.seek(reader.byteOffset + count * 4);

      return new Float32Array(values);
    }

    const readMask = (count: number) => {
      const hasMask = reader.readBoolean()
      if (!hasMask) return new Uint8Array(0);

      const mask = buffer.buffer.slice(reader.byteOffset, reader.byteOffset + count);
      reader.seek(reader.byteOffset + count);

      return new Uint8Array(mask);
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
    metadata["units"] = header.units; //Add units separatelly as logic of bin is not consistent
    readCategories(header.categoryCount);

    let values = new Float32Array(0);
    let nodata = null;

    if (request.includeData) {
      const valueCount = header.countX * header.countY;

      values = readValues(valueCount);
      const mask = readMask(valueCount);
      readDistribution();

      // If mask is present, replace masked values with nodata
      if (mask.length > 0) {
        // Choose number just outside of the range of values
        nodata = Math.floor(header.minValue - 1);

        // Replace masked values with nodata
        for (let i = 0; i < valueCount; i++) {
          if (!mask[i]) values[i] = nodata;
        }
      }
    }

    return {
      metadata: metadata,
      bounds: {
        north: header.north,
        east: header.east,
        south: header.south,
        west: header.west,
      },
      values: values,
      mask: nodata,
      countX: header.countX,
      countY: header.countY,
      minValue: header.minValue,
      maxValue: header.maxValue,
    };
  },

  async parseCSV(request: ParseRequest): Promise<GridData> {
    const { info } = request;

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
      parse(info.filename, {
        download: true,
        skipEmptyLines: true,
        step: function(row) {
          parseRow(row.data as [string, string]);
        },
        complete: function() {
          const [min, max] = getMinMax(values);
          let nodata = null;

          if (mask.length > 0) {
            // Choose number just outside of the range of values
            nodata = Math.floor(min - 1);

            // Replace masked values with nodata
            for (let i = 0; i < values.length; i++) {
              if (!mask[i]) values[i] = nodata;
            }
          }

          resolve({
            metadata,
            bounds: {
              north: parseFloat(metadata["North"]),
              east: parseFloat(metadata["East"]),
              south: parseFloat(metadata["South"]),
              west: parseFloat(metadata["West"]),
            },
            values: new Float32Array(values),
            mask: nodata,
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
}

expose(gridParser);
