import { PatchLevel, PatchLevelZoomRanges } from "../Data/Patch";

export const Rad2Deg = 180.0 / Math.PI;
export const Deg2Rad = Math.PI / 180.0;
export const EarthRadius = 6378137.0;

export function clamp01(value: number) {
  if (value < 0.0) return 0.0;
  return value > 1.0 ? 1 : value;
}

export function latToNormalizedMercator(value: number) {
  return Math.log(Math.tan((90 + value) * (Math.PI / 360.0))) * (1.0 / Math.PI);
}

export function getPatchLevel(zoom: number): PatchLevel {
  for (const [level, range] of PatchLevelZoomRanges.entries()) {
    if (zoom >= range[0] && zoom < range[1]) {
      return level as PatchLevel;
    }
  }

  throw Error("Zoom out-of-bounds");
}

export function calculateProjection(north: number, south: number, countY: number) {
  const min = latToNormalizedMercator(south);
  const max = latToNormalizedMercator(north);
  const invLatRange = (1.0 / (north - south));

  const lats = new Float32Array(countY);
  const projLatInterval = (max - min) / (countY - 1);

  for (let i = 0; i < countY; i++) {
    const projLat = min + i * projLatInterval;
    const lat = (2 * Math.atan(Math.exp(projLat * Math.PI)) - Math.PI * 0.5) * Rad2Deg;
    lats[i] = clamp01(1.0 - (lat - south) * invLatRange);
  }

  return lats;
}

export function lat2y(lat: number) {
  return Math.log(Math.tan(Math.PI / 4 + lat * Deg2Rad / 2)) * EarthRadius;
}

export function lon2x(lon: number) {
  return lon * Deg2Rad * EarthRadius;
}
