import { Program } from "./Program";

// Import shader source code as raw string
import vertexSource from '/src/assets/shaders/Contours.vertex.glsl?raw';
import fragmentSource from '/src/assets/shaders/Contours.fragment.glsl?raw';

export class ContoursProgram extends Program { }

export default new ContoursProgram(vertexSource, fragmentSource);
