export interface ColorLike extends Iterable<number> {
  r: number, g: number, b: number, a: number
}

export class Color implements ColorLike {
  public static colors: Record<string, Color> = {
    red: new Color(1.0, 0.0, 0.0),        // 0° Hue
    orange: new Color(1.0, 0.5, 0.0),     // 30° Hue
    yellow: new Color(1.0, 1.0, 0.0),     // 60° Hue
    lime: new Color(0.6, 0.8, 0.0),       // 90° Hue
    green: new Color(0.0, 0.7, 0.0),      // 120° Hue
    turquoise: new Color(0.0, 0.8, 0.5),  // 150° Hue
    cyan: new Color(0.0, 0.9, 1.0),       // 180° Hue
    skyBlue: new Color(0.0, 0.5, 1.0),    // 210° Hue
    blue: new Color(0.0, 0.0, 1.0),       // 240° Hue
    purple: new Color(0.5, 0.0, 1.0),     // 270° Hue
    magenta: new Color(1.0, 0.0, 1.0),    // 300° Hue
    pink: new Color(1.0, 0.0, 0.5),       // 330° Hue
  };

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

  public toHex(): string {
    return `#${(this.r*255).toString(16).padStart(2, '0')}${(this.g*255).toString(16).padStart(2, '0')}${(this.b*255).toString(16).padStart(2, '0')}`;
  }

  public array(): number[] {
    return [this.r, this.g, this.b, this.a];
  }

  public vec(): [number, number, number, number] {
    return [this.r, this.g, this.b, this.a];
  }

  public toRGBString(): string {
    return "rgb("+this.r*255 + "," + this.g*255  + "," + this.b*255  + ")";
  }

  *[Symbol.iterator](): IterableIterator<number> {
    const array = this.array();

    for (const value of array) {
      yield value;
    }
  }
}
