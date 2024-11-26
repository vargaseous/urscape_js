import { useState, useCallback } from "react";
import { observer } from "mobx-react";

import ContoursTool from "./Tools/ContoursTool";
import ExportTool from "./Tools/ExportTool";

import './Toolbox.css';
// Importing PNG icons
import { contours_icon, export_icon} from '../assets/textures';

export type Tab = {
  name: string;
  component: ({ active }: {
      active: boolean;
  }) => false | JSX.Element;
  closeable: boolean;
};


const Toolbox = observer(() => {
  const ToolSelection = ({ active }: { active: boolean }) => {
    return active && (
      <>
        <div className="toolbox-panel-content-item" id="x">
          <button 
            className="toolbox-button"  
            onClick={() => addTab({ 
              name: "Contours Tool", 
              component: ContoursTool, 
              closeable: true 
            })}
          >
            <img className="toolbox-icon" src={contours_icon} alt="Contours Tool" />
            Contours
          </button>
        </div>
        <div className="toolbox-panel-content-item" id="x">
          <button 
            className="toolbox-button" 
            onClick={() => addTab({ 
              name: "Export Tool", 
              component: ExportTool, 
              closeable: true 
            })}
          >
            <img className="toolbox-icon" src={export_icon} alt="Export Tool" /> 
            Export
          </button>
        </div>
      </>
    );
  };

  const [tabs, setTabs] = useState([
    { name: "Tools", component: ToolSelection, closeable: false }
  ]);

  const [tabIndex, setTabIndex] = useState(0);
const addTab = useCallback((tab: Tab) => {
  setTabs(prevTabs => {
    const existingTabIndex = prevTabs.findIndex(t => t.name === tab.name);
    
    if (existingTabIndex !== -1) {
      // If tab exists, just switch to it
      setTimeout(() => setTabIndex(existingTabIndex), 0);
      return prevTabs;
    } else {
      // If tab doesn't exist, add it and switch to it
      const updatedTabs = [...prevTabs, tab];
      setTimeout(() => setTabIndex(updatedTabs.length - 1), 0);
      return updatedTabs;
    }
  });
}, []);

  const handleCloseTab = useCallback((indexToClose: number) => {
    setTabs(prevTabs => prevTabs.filter((_, i) => i !== indexToClose));
    setTabIndex(0);
  }, []);

  return (
    <div className="toolbox">
      <div className="toolbox-panel">
        <div className="toolbox-panel-header">
          <div className="toolbox-panel-tabs">
            {tabs.map((tab, index) => {
              const active = tabIndex === index;
              const className = active ? "toolbox-panel-tab-active" : "toolbox-panel-tab";

              return (
                <div 
                  className={className} 
                  id={tab.name}
                  key={index} 
                  onClick={() => setTabIndex(index)}
                >
                  {tab.name}
                  {tab.closeable && (
                    <button 
                      className="close-button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent tab selection when closing
                        handleCloseTab(index);
                      }}
                    >
                      X
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="toolbox-panel-content">
          {tabs.map((tab, index) => (
            <tab.component key={index} active={tabIndex === index} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default Toolbox;