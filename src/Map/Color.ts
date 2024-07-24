export class Color implements Iterable<number> {
  public static red = new Color(1.0, 0.0, 0.0);
  public static green = new Color(0.0, 1.0, 0.0);
  public static blue = new Color(0.0, 0.0, 1.0);
  public static darkYellow = new Color(0.7, 0.7, 0.0);
  public static random = () => new Color(Math.random(), Math.random(), Math.random());

  public r: number
  public g: number
  public b: number
  public a: number

  constructor(r: number, g: number, b: number, a?: number) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a ?? 1.0;
  }

  public array(): number[] {
    return [this.r, this.g, this.b, this.a];
  }

  public vec(): [number, number, number, number] {
    return [this.r, this.g, this.b, this.a];
  }

  *[Symbol.iterator](): IterableIterator<number> {
    const array = this.array();

    for (const value of array) {
      yield value;
    }
  }
}
