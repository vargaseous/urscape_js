import { expose } from "comlink";
import { writeArrayBuffer } from "geotiff";
import { ColorLike } from "../../Map/Color";
import { GridData } from "../../Data/GridData";
import { BoundsLike, getMinMax } from "../../Data/DataUtils";
import { lat2y, lon2x } from "../../Map/MapUtils";

export type ExportTiffRequest = {
  image: ImageData,
  bounds: BoundsLike
}

export type ExportDataTiffRequest = {
  grids: GridData[],
  tints: ColorLike[],
  bounds: BoundsLike
}

export interface GridExporter {
  exportTIFF(request: ExportTiffRequest): Promise<ArrayBuffer>
  exportDataTIFF(request: ExportDataTiffRequest): Promise<ArrayBuffer>
}

const gridExporter: GridExporter = {
  async exportTIFF(request: ExportTiffRequest): Promise<ArrayBuffer> {
    const { image, bounds } = request;
    const { north, east, south, west } = bounds;

    const n = lat2y(north);
    const e = lon2x(east);
    const s = lat2y(south);
    const w = lon2x(west);

    const metadata = {
      GTModelTypeGeoKey: 1,
      GTRasterTypeGeoKey: 2,
      ProjectedCSTypeGeoKey: 3857,
      PhotometricInterpretation: 2,
      ExtraSamples: 1,
      ModelPixelScale: [
        (e - w) / image.width,
        (n - s) / image.height,
        0
      ],
      ModelTiepoint: [
        0, 0, 0, w, n, 0,
        0, 1, 0, w, s, 0,
        1, 0, 0, e, n, 0,
        1, 1, 0, e, s, 0
      ],
      width: image.width,
      height: image.height
    };

    return await writeArrayBuffer(image.data, metadata) as ArrayBuffer;
  },

  /**
   * TODO: Export TIFF as a combination of grid values and tints
   * @deprecated Work-in-progress
   */
  async exportDataTIFF(request: ExportDataTiffRequest): Promise<ArrayBuffer> {
    let dotsPerDegreeX = 0;
    let dotsPerDegreeY = 0;

    for (const grid of request.grids) {
      const { countX, countY, bounds } = grid;

      dotsPerDegreeX = Math.max(countX / (bounds.east - bounds.west), dotsPerDegreeX);
      dotsPerDegreeY = Math.max(countY / (bounds.north - bounds.south), dotsPerDegreeY);
    }

    const { north, east, south, west } = request.bounds;
    const countX = Math.round((east - west) * dotsPerDegreeX);
    const countY = Math.round((north - south) * dotsPerDegreeY);

    const bytes = new Uint8Array(countX * countY * 3);

    // Add values from every grid to the array
    for (let i = 0; i < request.grids.length; i++) {
      const grid = request.grids[i];
      const { countX, countY, bounds } = grid;

      const offsetX = Math.round((bounds.west - request.bounds.west) * dotsPerDegreeX);
      const offsetY = Math.round((bounds.north - request.bounds.north) * dotsPerDegreeY);

      // Normalize values and apply gamma correction
      const [min, max] = getMinMax(grid.values);
      const values = grid.values
        .map(x => (x - min) / (max - min))
        .map(x => Math.pow(x, 0.25));

      for (let y = 0; y < countY; y++) {
        for (let x = 0; x < countX; x++) {
          const value = values[y * countX + x];
          const index = (y + offsetY) * countX + (x + offsetX) * 3;

          bytes[index    ] = value * request.tints[i].r;
          bytes[index + 1] = value * request.tints[i].g;
          bytes[index + 2] = value * request.tints[i].b;
        }
      }
    }

    const metadata = {
      width: countX,
      height: countY
    }

    const array = await writeArrayBuffer(bytes, metadata) as ArrayBuffer;

    return array;
  }
}

expose(gridExporter);
