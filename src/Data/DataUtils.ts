export interface BoundsLike {
  north: number;
  east: number;
  south: number;
  west: number;
}

export class AreaBounds {
  public static inf = () => new AreaBounds({
    north: -Infinity,
    east: -Infinity,
    south: Infinity,
    west: Infinity
  });

  public north: number;
  public east: number;
  public south: number;
  public west: number;

  constructor(bounds: BoundsLike) {
    this.north = bounds.north;
    this.east = bounds.east;
    this.south = bounds.south;
    this.west = bounds.west;
  }

  public add(bounds: BoundsLike) {
    this.north = Math.max(this.north, bounds.north);
    this.east = Math.max(this.east, bounds.east);
    this.south = Math.min(this.south, bounds.south);
    this.west = Math.min(this.west, bounds.west);
  }

  public intersect(other: BoundsLike): boolean {
    return this.east > other.west &&
      this.west < other.east &&
      this.north > other.south &&
      this.south < other.north;
  }

  public inside(other: BoundsLike): boolean {
    return this.east <= other.east &&
      this.west >= other.west &&
      this.north <= other.north &&
      this.south >= other.south;
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

export function getMinMax(array: ArrayLike<number>): [number, number] {
  let len = array.length;
  let max = -Infinity;
  let min = +Infinity;

  while (len--) {
    max = array[len] > max ? array[len] : max;
    min = array[len] < min ? array[len] : min;
  }

  return [min, max];
}
