import { CustomLayerInterface } from "maplibre-gl";
import { Patch } from "../Data/Patch";
import { DataLayer } from "../Data/DataLayer";

export interface MapLayer extends CustomLayerInterface
{
  active: boolean
  get dataLayer(): DataLayer
  get patch(): Patch
}
