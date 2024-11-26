import { useRef, useEffect, useState } from 'react';
import { autorun, reaction } from 'mobx'
import { observer } from 'mobx-react';
import { eventBus } from './EventBus';
import { useStore } from './Stores/RootStore';
import { AreaBounds } from './Data/DataUtils';
import { blobToImageData } from './Utils';

import gridExporter from './Workers/GridExporter';
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
      antialias: true,
      preserveDrawingBuffer: true
    });

    setMap(newMap);

    const events = [
      eventBus.on("mapScreenshot", async () => {
        const blob = await takeScreenshot(newMap);
        const link = document.createElement('a');
        link.download = 'screenshot.png';
        link.href = URL.createObjectURL(blob);
        link.click();

        URL.revokeObjectURL(link.href);
      }),

      eventBus.on("mapExportTIFF", async () => {
        const backgroundLayers: string[] = [];

        // Hide all background layers
        newMap.getLayersOrder().forEach((id) => {
          const layer = newMap.getLayer(id);

          if (layer && layer?.type !== "custom") {
            layer?.setLayoutProperty("visibility", "none");
            backgroundLayers.push(id);
          }
        });

        newMap.redraw();

        const blob = await takeScreenshot(newMap);
        const imageData = await blobToImageData(blob);

        // Manually adjust appearance
        // for (let i = 3; i < imageData.data.length; i += 4) {

        //   imageData.data[i] *= 5; // Adjust by 5 TODO make configurable
        // }
        const bounds = newMap.getBounds();
        const array = await gridExporter.exportTIFF({
          image: imageData,
          bounds: {
            north: bounds.getNorth(),
            east: bounds.getEast(),
            south: bounds.getSouth(),
            west: bounds.getWest()
          }
        });

        const tiff = new Blob([array], { type: "image/tiff" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(tiff);
        link.download = "output.tiff";
        link.click();

        URL.revokeObjectURL(link.href);

        // Restore all background layers
        backgroundLayers.forEach((id) => {
          newMap.setLayoutProperty(id, "visibility", "visible");
        });
      }),

      eventBus.on("mapRedraw", () => {
        newMap.triggerRepaint();
      })
    ];

    // Clean-up function
    return () => {
      newMap?.remove();
      events.forEach((off) => off());
    }
  }, []);

  // Synchronize layers with Maplibre
  useEffect(() => autorun(() => {
    if (!map) return;

    const mapCache = mapStore.mapCache;
    const mapLayers = Array.from(mapStore.mapLayers.values())
      .concat(Array.from(mapCache.values()));

    const oldIds = new Set(map.getLayersOrder());
    const newIds = new Set(mapLayers.map(x => x.id));

    const layers = map.getLayersOrder()
      .map(id => map.getLayer(id)!)
      .filter(layer => layer.type == "custom");

    // Remove layers which are no longer in mapLayers state
    for (const layer of layers) {
      if (!newIds.has(layer.id)) {
        map.removeLayer(layer.id);
        console.debug("[maplibre event] removeLayer", layer);
      }
    }

    // Add layers which were added to mapLayers state
    for (const mapLayer of mapLayers.values()) {
      if (!oldIds.has(mapLayer.id)) {
        map.addLayer(mapLayer);
        console.debug("[maplibre event] addLayer", mapLayer);
      }
    }

    // Update layers visibility
    for (const layer of mapLayers) {
      map.setLayoutProperty(layer.id, "visibility", layer.active ? "visible" : "none");
    }
  }), [map, mapStore]);

  // Fit map on site change
  useEffect(() => reaction(
    () => dataStore.sites.find(x => x.selected),
    (site) => {
      if (!map) return;
      if (site && site.bounds.valid) {
        map.fitBounds([
          [site.bounds.east, site.bounds.north],
          [site.bounds.west, site.bounds.south]
        ]);
      }
    },
    { name: "fitMapBounds" }
  ), [map, dataStore]);

  // Update map state on camera movement
  useEffect(() => {
    if (!map) return;

    const updateMapState = () => {
      const bounds = map.getBounds();
      mapStore.updateMapState({
        ...mapStore.mapState,
        bounds: new AreaBounds({
          north: bounds.getNorth(),
          east: bounds.getEast(),
          south: bounds.getSouth(),
          west: bounds.getWest(),
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

const takeScreenshot = (map: maplibregl.Map, scaleFactor: number = 1) => { 
  const canvas = map.getCanvas(); 
  const ctx = canvas.getContext("webgl2"); 
  if (!ctx) throw new Error("Failed to get WebGL2 context"); 
  
  const width = canvas.width * scaleFactor;
  const height = canvas.height * scaleFactor;

  // Create a new high-resolution canvas
  const canvas2d = document.createElement('canvas'); 
  const ctx2d = canvas2d.getContext('2d'); 
  if (!ctx2d) throw new Error("Failed to get 2D context"); 
  
  canvas2d.width = width; 
  canvas2d.height = height; 

  // Scale the context to ensure content looks the same
  ctx2d.scale(scaleFactor, scaleFactor);
  
  // Draw the original canvas onto the new canvas
  ctx2d.drawImage(canvas, 0, 0);

  return new Promise<Blob>( 
      (resolve, reject) => { 
          canvas2d.toBlob((blob) => { 
              if (!blob) { 
                  reject(); 
                  return; 
              } 
              resolve(blob); 
          }); 
      } 
  ); 
}

export default Map;
