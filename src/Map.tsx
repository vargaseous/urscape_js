import { useRef, useEffect, useState } from 'react';
import maplibre, { StyleSpecification } from 'maplibre-gl';
import { Layer } from './DataLayers/Layer';

import './Map.css';
import 'maplibre-gl/dist/maplibre-gl.css';

import mapStyle from './assets/style.json';

type Props = {
  layers: Layer[]
};

export default function Map(props: Props) {
  const { layers } = props;
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibre.Map | null>(null)

  // Setup Maplibre
  useEffect(() => {
    const newMap = new maplibre.Map({
      container: mapRef.current as HTMLElement,
      // projection: 'globe',
      style: mapStyle as StyleSpecification,
      center: [107.641, -6.866],
      zoom: 13,
      antialias: true
    });

    setMap(newMap);

    // Clean-up function
    return () => {
      newMap?.remove();
    }
  }, []);

  // Add map layers
  useEffect(() => {
    layers.forEach(layer => {
      if (layer.active && !map?.getLayer(layer.id)) {
        map?.addLayer(layer);
      }
      else if (!layer.active && map?.getLayer(layer.id)) {
        map?.removeLayer(layer.id);
      }
    });
  }, [map, layers]);

  return (
    <div className="map-wrap">
      <div className="map" ref={mapRef} />
    </div>
  );
}
