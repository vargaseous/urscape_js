export const Rad2Deg = 180.0 / Math.PI;

export function clamp01(value: number) {
  if (value < 0.0) return 0.0;
  return value > 1.0 ? 1 : value;
}

export function latToNormalizedMercator(value: number) {
  return Math.log(Math.tan((90 + value) * (Math.PI / 360.0))) * (1.0 / Math.PI);
}
