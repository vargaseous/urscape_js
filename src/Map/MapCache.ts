import { LRUCache } from "lru-cache";
import { MapLayer } from "../Map/MapLayer";

export class MapCache extends LRUCache<string, MapLayer> {
  constructor(size: number) {
    super({
      max: size,
      dispose: (layer) => {
        console.debug("[mapcache event] evict", layer.id);
      }
    });
  }
}
