import { CustomLayerInterface } from "maplibre-gl";

export interface Layer extends CustomLayerInterface
{
  active: boolean
}
