import { useEffect, Dispatch, SetStateAction } from 'react';
import { Layer } from './DataLayers/Layer';
import { parseCSV } from './DataLayers/GridData';
import { GridLayer } from './DataLayers/GridLayer';

import topologyCSV from './assets/data/topology.csv?raw';
import densityCSV from './assets/data/density.csv?raw';
import soilCSV from './assets/data/soil_D_0.csv?raw';

type Props = {
  layers: Layer[]
  setLayers: Dispatch<SetStateAction<Layer[]>>
};

export default function LayerController(props: Props) {
  const { setLayers } = props;

  useEffect(() => {
    async function parseGrid() {
      const gridData = [
        await parseCSV(topologyCSV),
        await parseCSV(densityCSV),
        await parseCSV(soilCSV),
      ];

      const layers = [];
      layers.push(new GridLayer("topology", gridData[0], [1.0, 0.0, 0.0]));
      layers.push(new GridLayer("density", gridData[1], [0.0, 1.0, 0.0]));
      layers.push(new GridLayer("soil", gridData[2], [0.0, 0.0, 1.0]));

      setLayers(layers);
    }

    parseGrid()
  }, [setLayers]);

  return (
    <>
    </>
  )
}
