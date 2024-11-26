import { AreaBounds } from "../Data/DataUtils";

export type MapState = {
  zoom: number
  bounds: AreaBounds
}

export function createMapState() {
  return {
    zoom: 0,
    bounds: AreaBounds.inf()
  };
}
