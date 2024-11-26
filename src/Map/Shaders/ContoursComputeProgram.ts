import { Program } from "./Program";

// Import shader source code as raw string
import vertexSource from '/src/assets/shaders/ContoursCompute.vertex.glsl?raw';
import fragmentSource from '/src/assets/shaders/ContoursCompute.fragment.glsl?raw';

export class ContoursComputeProgram extends Program { }

export default new ContoursComputeProgram(vertexSource, fragmentSource);
