// NOT IN USE. Superseded by assets/style.json

import { StyleSpecification } from "maplibre-gl"

const style: StyleSpecification = {
  version: 8,
  metadata: {
    projection: "globe"
  },
  sources: {
    rasterSource: {
      type: "raster",
      url: `https://api.maptiler.com/maps/satellite/256/tiles.json?key=${import.meta.env.VITE_API_KEY}`,
      tileSize: 256
    },
    terrainSource: {
      type: "raster-dem",
      url: `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${import.meta.env.VITE_API_KEY}`,
      tileSize: 256
    }
  },
  terrain: {
    source: "terrainSource",
    exaggeration: 1
  },
  glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${import.meta.env.VITE_API_KEY}`,
  layers: [
    {
      id: "rasterLayer",
      type: "raster",
      source: "rasterSource"
    }
  ]
};

export default style;