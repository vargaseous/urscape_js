import { observer } from "mobx-react";
import { eventBus } from "../../EventBus";

const ExportTool = observer(({ active }: { active: boolean }) => {
  const saveScreenshot = async () => {
    eventBus.emit("mapScreenshot");
  }

  const exportTIFF = async () => {
    eventBus.emit("mapExportTIFF");
  }

  return active && (
    <>
      <div className="toolbox-panel-content-item">
        <button onClick={() => saveScreenshot()}>Screenshot</button>
      </div>
      <div className="toolbox-panel-content-item">
        <button onClick={() => exportTIFF()}>Export TIFF</button>
      </div>
    </>
  )
});

export default ExportTool;
