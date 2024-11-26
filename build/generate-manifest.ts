import fs from "fs";
import path from "path";
import { globSync } from "glob";

console.log("Generating manifest file...");

const files = globSync('./public/data/**/*.{bin,csv,tiff}', { "posix": true });
const patchPaths: string[] = [];

for (const file of files) {
  patchPaths.push(path.posix.relative('./public/data', file));
}

fs.writeFileSync('./public/data/manifest.json', JSON.stringify(patchPaths, null, 2));

console.log("Done!");
