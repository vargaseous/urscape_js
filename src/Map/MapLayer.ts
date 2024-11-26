import { CustomLayerInterface } from "maplibre-gl";

export interface MapLayer extends CustomLayerInterface
{
  active: boolean
}
