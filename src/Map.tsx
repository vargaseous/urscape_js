import { useRef, useEffect, useState } from 'react';
import { autorun, reaction } from 'mobx'
import { useStore } from './Stores/RootStore';
import { observer } from 'mobx-react';
import { AreaBounds } from './Data/DataUtils';

import maplibre, { StyleSpecification } from 'maplibre-gl';

import './Map.css';
import 'maplibre-gl/dist/maplibre-gl.css';

import mapStyle from './assets/style.json';

const Map = observer(() => {
  const { dataStore, mapStore } = useStore();

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibre.Map | null>(null);

  // Setup Maplibre
  useEffect(() => {
    const newMap = new maplibre.Map({
      container: mapRef.current as HTMLElement,
      // projection: 'globe',
      style: mapStyle as StyleSpecification,
      center: [0, 0],
      zoom: 0,
      antialias: true
    });

    setMap(newMap);

    // Clean-up function
    return () => {
      newMap?.remove();
    }
  }, []);

  // Synchronize layers with Maplibre
  useEffect(() => autorun(() => {
    if (!map) return;
    const mapLayers = mapStore.mapLayers;
    const mapCache = mapStore.mapCache;

    const oldIds = new Set(map.getLayersOrder());
    const newIds = new Set(mapLayers.keys());
    for (const id of mapCache.keys())
      newIds.add(id); // Include cached layers

    const layers = map.getLayersOrder()
      .map(id => map.getLayer(id)!)
      .filter(layer => layer.type == "custom");

    // Remove layers which are no longer in mapLayers state
    for (const layer of layers) {
      if (!newIds.has(layer.id)) {
        map.removeLayer(layer.id);
        console.debug("[maplibre event] removeLayer", layer.id);
      }
    }

    // Add layers which were added to mapLayers state
    for (const mapLayer of mapLayers.values()) {
      if (!oldIds.has(mapLayer.id)) {
        map.addLayer(mapLayer);
        console.debug("[maplibre event] addLayer", mapLayer.id);
      }
    }

    // Update layers visibility
    for (const id of newIds) {
      const layer = (mapLayers.get(id) ?? mapCache.get(id))!;
      map.setLayoutProperty(id, "visibility", layer.active ? "visible" : "none");
    }
  }), [map, mapStore]);

  // Fit map on site change
  useEffect(() => reaction(
    () => dataStore.sites.map(x => x.selected),
    () => {
      if (!map) return;
      const site = dataStore.sites.find(x => x.selected);

      if (site && site.bounds.valid) {
        map.fitBounds([
          [site.bounds.east, site.bounds.north],
          [site.bounds.west, site.bounds.south]
        ]);
      }
    }
  ), [map, dataStore]);

  useEffect(() => {
    if (!map) return;

    const updateMapState = () => {
      const bounds = map.getBounds();
      mapStore.updateMapState({
        bounds: new AreaBounds({
          north: bounds._ne.lat,
          east: bounds._ne.lng,
          south: bounds._sw.lat,
          west: bounds._sw.lng,
        }),
        zoom: map.getZoom()
      });
    };

    updateMapState();

    map.on('move', () => {
      updateMapState();
    });
  }, [map, mapStore]);

  return (
    <div className="map-wrap">
      <div className="map" ref={mapRef} />
    </div>
  );
});

export default Map;
