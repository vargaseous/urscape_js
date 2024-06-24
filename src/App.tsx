import { useState } from 'react';
import Map from './Map';
import Gui from './gui';
import { Layer } from './DataLayers/Layer';
import LayerController from './LayerController';

import './App.css';

function App() {
  const [layers, setLayers] = useState<Layer[]>([]);

  return (
    <>
      <Map layers={layers} />
      <LayerController
        layers={layers}
        setLayers={setLayers} />
      <Gui
        layers={layers}
        setLayers={setLayers} />
    </>
  )
}

export default App;
