import { Dispatch, SetStateAction } from 'react';

import './gui.css';
import { Layer } from './DataLayers/Layer';

type Props = {
  layers: Layer[]
  setLayers: Dispatch<SetStateAction<Layer[]>>
};

export default function Gui(props: Props) {
  const { layers, setLayers } = props;
 const locations: Layer[] = [];
  const onLayerClicked = (layer: Layer) => {

    // React compares references instead of full equality,
    // we need to copy values to a new array to cause rerender
    layer.active = !layer.active;
    setLayers([...layers]);
  }

  const addButton = (layer: Layer) => {
    return (
      <button className={"layer-button " + (layer.active ? "active" : "")} key={layer.id} onClick={() => onLayerClicked(layer)}>
        {layer.id.charAt(0).toUpperCase() + layer.id.slice(1)}
      </button>
    );
  };
  const drawGUI = () => {
    return (
      <div className="left-panel">
        <div className="left-layers">
          <div className="header"> {"DataLayers"} </div>
          <div className="container">
            { layers.map((layer) => addButton(layer)) }
          </div>
          <div className="left-locations">
            <div className="header"> {"Locations"} </div>
            <div className="container">
              { locations.map((location) => addButton(location)) }
            </div>
          </div>
        </div>


      </div>
    );
  };

  return (
    <div>
      { drawGUI() }
    </div>
  );
}
