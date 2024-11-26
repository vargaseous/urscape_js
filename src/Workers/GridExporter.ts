import { wrap } from "comlink";
import { GridExporter } from "../assets/workers/GridExporter";

import Worker from '../assets/workers/GridExporter.ts?worker';

export default wrap<GridExporter>(new Worker());
