import { wrap } from "comlink";

import { GridParser } from "../assets/workers/GridParser";
import Worker from '../assets/workers/GridParser.ts?worker';

export default wrap<GridParser>(new Worker());
