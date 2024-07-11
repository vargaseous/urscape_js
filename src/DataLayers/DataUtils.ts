export interface BoundsLike {
  north: number;
  east: number;
  south: number;
  west: number;
}

export class AreaBounds {
  public static inf = () => new AreaBounds(-Infinity, -Infinity, Infinity, Infinity);

  public north: number;
  public east: number;
  public south: number;
  public west: number;

  constructor(north: number, east: number, south: number, west: number) {
    this.north = north;
    this.east = east;
    this.south = south;
    this.west = west;
  }

  public add(bounds: BoundsLike) {
    this.north = Math.max(this.north, bounds.north);
    this.east = Math.max(this.east, bounds.east);
    this.south = Math.min(this.south, bounds.south);
    this.west = Math.min(this.west, bounds.west);
  }

  public get center(): [number, number] {
    return [
      (this.east + this.west) / 2,
      (this.north + this.south) / 2,
    ];
  }

  public get valid(): boolean {
    return this.east > this.west && this.north > this.south
  }
}

export function getMinMax(array: number[]): [number, number] {
  let len = array.length;
  let max = -Infinity;
  let min = +Infinity;

  while (len--) {
    max = array[len] > max ? array[len] : max;
    min = array[len] < min ? array[len] : min;
  }

  return [min, max];
}
