import { useRef, useEffect, useState } from 'react';
import { autorun, reaction } from 'mobx'
import { useStore } from './Stores/RootStore';
import { observer } from 'mobx-react';

import maplibre, { StyleSpecification } from 'maplibre-gl';

import './Map.css';
import 'maplibre-gl/dist/maplibre-gl.css';

import mapStyle from './assets/style.json';

const Map = observer(() => {
  const { dataStore, mapStore } = useStore();

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibre.Map | null>(null)

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

    const oldIds = new Set(map.getLayersOrder());
    const newIds = new Set(mapLayers.keys());

    const layers = map.getLayersOrder()
      .map(id => map.getLayer(id)!)
      .filter(layer => layer.type == "custom");

    // Remove layers which are no longer in mapLayers state
    for (const layer of layers) {
      if (!newIds.has(layer.id)) {
        map.removeLayer(layer.id);
      }
    }

    // Add layers which were added to mapLayers state
    for (const mapLayer of mapLayers.values()) {
      if (!oldIds.has(mapLayer.id)) {
        map.addLayer(mapLayer);
      }
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
  ), [map, dataStore])

  return (
    <div className="map-wrap">
      <div className="map" ref={mapRef} />
    </div>
  );
})

export default Map;
