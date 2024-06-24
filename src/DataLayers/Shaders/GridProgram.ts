import { Program } from "./Program";

// Import shader source code as raw string
import vertexSource from '/src/assets/shaders/grid.vertex.glsl?raw';
import fragmentSource from '/src/assets/shaders/grid.fragment.glsl?raw';

export class GridProgram extends Program { }

export default new GridProgram(vertexSource, fragmentSource);
