import { useCallback, useState } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../Stores/RootStore';
import { Site } from '../Data/Site';
import { Color } from '../Map/Color';
import { DataLayer } from '../Data/DataLayer';
import Toolbox from './Toolbox';
import ImportModal from './Modals/ImportModal';
import DoubleRangeSlider from './DoubleRangeSlider';

import './Gui.css';
import { filter_on, filter_off, info_on, info_off } from '../assets/textures';

const Gui = observer(() => {
  const { dataStore } = useStore();
  const { patchStore, dataLayers, sites } = dataStore;

  const [importOpen, setImportOpen] = useState(false);

  const openImport = useCallback(() => setImportOpen(true), []);
  const closeImport = useCallback(() => setImportOpen(false), []);

  const onLayerClicked = useCallback((dataLayer: DataLayer) => dataLayer.toggleSelect(), []);
  const onFilterClicked = useCallback((dataLayer: DataLayer) => dataLayer.toggleFilter(), []);
  const onColorClicked = useCallback((dataLayer: DataLayer) => dataLayer.toggleColor(), []);
  const onInfoClicked = useCallback((dataLayer: DataLayer) => dataLayer.toggleInfo(), []);
  const setTint = useCallback((dataLayer: DataLayer, tint: Color) => dataLayer.setTint(tint), []);
  const onSiteClicked = useCallback((site: Site) => dataStore.selectSite(site), [dataStore]);
  const onSliderChange = useCallback((dataLayer: DataLayer, min: number, max: number) => dataLayer.setFilter(min, max), []);

  const addLayerButton = (layer: DataLayer, index: number) => {
    if (layer.hidden) return null;

    const ah = layer.selected ? "show" : "hide";
    const layerExpanded = (layer.selected && layer.expanded? "expanded " : "collapsed ");
    const layerActive = (layer.selected ? "selected " : " ");

    return (
      <div className={"data-layer " + layerExpanded + layerActive} key={index}>
          <button className={"layer-button " + (layer.selected ? "active " : "nonactive ")}
             onClick={() => onLayerClicked(layer)}>
            {layer.name.charAt(0).toUpperCase() + layer.name.slice(1)}
          </button>
          <div className={"spinner spinner--steps icon-spinner" + (layer.loaded ? 'hide' : '') }
            style={{ color: layer.tint.toRGBString()}}>
            &nbsp;
          </div>
          <button className={"lb-color " + (layer.loaded ? '' : 'hide')}
            onClick={() => onColorClicked(layer)}
            style={{ backgroundColor:  layer.tint.toRGBString(),borderTopColor: layer.tint.toRGBString()}}>
            &nbsp;
          </button>
          <button  className={"lb-filter " + ah}  onClick={() => {onFilterClicked(layer);}}>
            { <img className="icon" src={layer.filtered ? filter_on : filter_off} /> }
          </button>
          <button className={"lb-info " + ah} onClick={() => onInfoClicked(layer)}>
            { <img className="icon" src={layer.informed ? info_on : info_off} /> }
          </button>
          <div className={"slider-container " + (layer.filtered && layer.selected ? "" : "hide")}>
            {
              layer.filtered && layer.selected &&
              <DoubleRangeSlider
                onChange={(min, max) => onSliderChange(layer, min / 100, max / 100)}
                initialMinValue={layer.filter[0] * 100}
                initialMaxValue={layer.filter[1] * 100} />
            }
          </div>
          <div className={"color-container " + (layer.colored && layer.selected ? "" : "hide")}>
            { Object.values(Color.colors).map((color: Color, index: number) => (
              <button
                key={index}
                style={{ backgroundColor: color.toRGBString() }}
                className="color-button"
                onClick={() => setTint(layer, color)}
              > &nbsp;
              </button>
            ))}
          </div>
          <div className={"info-container " + (layer.informed && layer.selected ? "" : "hide")}>
            <div className="info-row">
              <label className='info-label' >Date: </label>
              <input className = "info-input" type="text" value={layer.metadata.date || ''} onChange={()=>{}}></input>
            </div>
            <div className="info-row">
              <label className='info-label'>Units:</label>
              <input className = "info-input" type="text" value={layer.metadata.units || ''} onChange={()=>{}} ></input>
            </div>
            <div className="info-row">
              <label className='info-label'>Source: </label>
              <input className = "info-input" type="text"  value={layer.metadata.source|| ''} onChange={()=>{}}></input>
            </div>
            <div className="info-row">
              <label className='info-label'>Extent:</label>
              <input className = "info-input" type="text"  value={layer.metadata.extent|| ''} onChange={()=>{}}></input>
            </div>
          </div>
      </div>
    );
  };

  const addSiteButton = (site: Site, index: number) => {
    return (
      <button className={"site-button " + (site.selected ? "selected" : "")} key={index} onClick={() => onSiteClicked(site)}>
        {site.name.charAt(0).toUpperCase() + site.name.slice(1)}
      </button>
    );
  };

  const addImport = () => {
    return (
      <>
        <button className="layer-button" onClick={openImport} disabled={patchStore.loading}>
          + Add new layer  {patchStore.loading ? "(Loading...)" : ""}
        </button>
        <ImportModal isOpen={importOpen} onClose={closeImport} />
      </>
    );
  };

  const drawGUI = () => {
    return (
      <>
        <div className="left-panel">
          <div className="left-layers">
            <div className="header">{"DataLayers"}</div>
            <div className="left-import"> {addImport()} </div>
            <div className="container-layers">
              {dataLayers.map((layer, index) => addLayerButton(layer, index))}
            </div>
            <div className="left-locations">
              <div className="header">{"Locations"}</div>
              <div className="container-sites">
                {sites.map((site, index) => addSiteButton(site, index))}
              </div>
            </div>
          </div>
        </div>
        <Toolbox />
      </>
    );
  };

  return <div>{drawGUI()}</div>;
});

export default Gui;
