import { useCallback, useState } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../Stores/RootStore';
import { Site } from '../Data/Site';
import { DataLayer } from '../Data/DataLayer';

import ImportModal from './Modals/ImportModal';

import './Gui.css';

const Gui = observer(() => {
  const { dataStore } = useStore();
  const [importOpen, setImportOpen] = useState(false);

  const openImport = useCallback(() => setImportOpen(true), []);
  const closeImport = useCallback(() => setImportOpen(false), []);

  const onLayerClicked = useCallback((dataLayer: DataLayer) => dataLayer.toggleSelect(), []);
  const onSiteClicked = useCallback((site: Site) => dataStore.selectSite(site), [dataStore]);

  const addLayerButton = (layer: DataLayer) => {
    if (layer.hidden) return;
    return (
      <button className={"layer-button " + (layer.selected ? "active" : "")} key={layer.name} onClick={() => onLayerClicked(layer)}>
        {layer.name.charAt(0).toUpperCase() + layer.name.slice(1)}
      </button>
    );
  };

  const addSiteButton = (site: Site) => {
    return (
      <button className={"layer-button " + (site.selected ? "active" : "")} key={site.name} onClick={() => onSiteClicked(site)}>
        {site.name.charAt(0).toUpperCase() + site.name.slice(1)}
      </button>
    );
  };

  const addImport = () => {
    return (
      <>
        <button className="layer-button" onClick={openImport}>
          Import
        </button>
        <ImportModal isOpen={importOpen} onClose={closeImport}/>
      </>
    );
  };

  const drawGUI = () => {
    return (
      <div className="left-panel">
        <div className="left-import">
          { addImport() }
        </div>
        <div className="left-layers">
          <div className="header"> {"DataLayers"} </div>
          <div className="container">
            { dataStore.dataLayers.map((layer) => addLayerButton(layer)) }
          </div>
          <div className="left-locations">
            <div className="header"> {"Locations"} </div>
            <div className="container">
              { dataStore.sites.map((site) => addSiteButton(site)) }
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
});

export default Gui;
