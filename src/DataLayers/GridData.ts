import { parse } from 'csv-parse';

enum GridDataSection {
  Metadata,
  Categories,
  Values
}

export type GridBounds = {
  north: number;
  east: number;
  south: number;
  west: number;
}

export type GridMetadata = {
  [key: string]: string | number | boolean;
};

export type GridData = {
  metadata: GridMetadata;
  bounds: GridBounds;
  values: number[];
  mask: number[];
  countX: number,
  countY: number,
  minValue: number;
  maxValue: number;
};

function getMinMax(array: number[]): [number, number] {
  let len = array.length;
  let max = -Infinity;
  let min = +Infinity;

  while (len--) {
      max = array[len] > max ? array[len] : max;
      min = array[len] < min ? array[len] : min;
  }

  return [min, max];
}

export function parseCSV(input: string): Promise<GridData> {
  return new Promise((resolve, reject) => {
    parse(input, {
      delimiter: ',',
      columns: false,
      skip_empty_lines: true,
      trim: true
    }, (err: unknown, records: string[][]) => {
      if (err) {
        return reject(err);
      }

      const metadata: GridMetadata = {};
      const values: number[] = [];
      const mask: number[] = [];
      let section: GridDataSection | null = null;

      for (const record of records) {
        const [key, value] = record;

        if (key == 'METADATA') {
          section = value == 'TRUE'
            ? GridDataSection.Metadata
            : section;

          continue;
        }
        else if (key == 'CATEGORIES') {
          section = value == 'TRUE'
            ? GridDataSection.Categories
            : section;

          continue;
        }
        else if (key == 'VALUE' && value == 'MASK') {
          section = GridDataSection.Values
          continue;
        }

        switch (section) {
          case GridDataSection.Metadata:
            if (!isNaN(Number(value))) {
              metadata[key] = Number(value);
            } else if (value.trim().toUpperCase() === 'TRUE' || value.trim().toUpperCase() === 'FALSE') {
              metadata[key] = value.trim().toUpperCase() === 'TRUE';
            } else {
              metadata[key] = value;
            }
            break;
          case GridDataSection.Categories:
            throw new Error("Not implemented");
          case GridDataSection.Values:
            values.push(parseInt(key));
            mask.push(parseInt(value));
            break;
        }
      }

      const [min, max] = getMinMax(values);

      resolve({
        metadata,
        bounds: {
          north: metadata["North"] as number,
          east: metadata["East"] as number,
          south: metadata["South"] as number,
          west: metadata["West"] as number,
        },
        values, mask,
        countX: metadata["Count X"] as number,
        countY: metadata["Count Y"] as number,
        minValue: min,
        maxValue: max,
      });
    });
  });
}