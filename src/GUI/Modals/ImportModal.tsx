import { MouseEventHandler, useCallback, useState } from "react"
import { observer } from "mobx-react";
import { useStore } from "../../Stores/RootStore";
import { GridPatch } from "../../Data/GridPatch";
import { AreaBounds } from "../../Data/DataUtils";
import { parseInfo } from "../../Data/DataSource";

import Modal from "../Modal";
import worker from "../../Workers/GridParser";

import "./ImportModal.css";

type Props = {
  isOpen: boolean,
  onClose: MouseEventHandler<HTMLButtonElement>
}

type Progress = {
  total: number,
  completed: number
};

const ImportModal = observer(({isOpen, onClose}: Props) => {
  const { dataStore } = useStore();
  const patchStore = dataStore.patchStore;

  const [progress, setProgress] = useState<Progress>({
    total: 0,
    completed: 0
  });

  const handleFileImport = useCallback(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;

    setProgress({
      total: input.files.length,
      completed: 0
    });

    for (const file of input.files) {
      const info = parseInfo(file.name);

      if (!info) {
        console.warn(`Invalid filename format: ${file.name}, skipping`);
        continue;
      }

      const array = await file.arrayBuffer();
      const data = await worker.parseGrid({info, array, includeData: true});

      const bounds = new AreaBounds(data.bounds);
      const patch = new GridPatch(info);
      patch.bounds = bounds;
      patch.data = data;

      await patchStore.store(patch);

      delete patch.data;
      dataStore.pushPatch(patch);

      setProgress(p => ({
        total: input.files?.length ?? 0,
        completed: p.completed + 1
      }));
    }

    setProgress({
      total: 0,
      completed: 0
    });

    e.preventDefault();
  }, [dataStore, patchStore]);

  const onFileImport = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
    input.setAttribute("multiple", "");
    input.addEventListener("change", handleFileImport, false);
    input.click();
  }, [handleFileImport])

  const drawProgress = (progress: Progress) => {
    return (
      <>
        <p>Importing in progress: {progress.completed}/{progress.total} items</p>
      </>
    )
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <button className="import-button" onClick={onFileImport}>
          File Import
        </button>
        {
          progress.total !== 0 ? drawProgress(progress) : <></>
        }
      </Modal>
    </>
  )
});

export default ImportModal
