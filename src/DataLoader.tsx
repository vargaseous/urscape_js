import { useEffect, useState, useCallback } from 'react';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import { useStore } from './Stores/RootStore';
import { PatchResponse } from './DataLayers/PatchRequest';

import GridParser from './assets/workers/GridParser.ts?worker';

const DataLoader = observer(() => {
  const { dataStore: { patchStore } } = useStore();
  const patchRequests = patchStore.patchRequests;

  const [parser, setParser] = useState<Worker | null>(null);

  const pushResult = useCallback((response: PatchResponse) => {
    patchStore.completePatchRequest(response);
  }, [patchStore]);

  // Initialize GridParser web worker
  useEffect(() => {
    const parser = new GridParser();
    parser.onmessage = (e: MessageEvent<PatchResponse>) => pushResult(e.data);
    parser.onerror = (event) => console.error("GridParser Error: " + event.message);

    setParser(parser);

    return () => {
      parser.terminate();
    }
  }, [pushResult, setParser])

  // Publish unpublished requests
  useEffect(() => autorun(() => {
    if (!parser) return;
    for (const request of patchRequests.values()) {
      if (!request.published) {
        parser.postMessage(request);
        request.published = true;
      }
    }
  }), [parser, patchRequests])

  return (
    <>
    </>
  )
});

export default DataLoader;
