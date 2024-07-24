import { v4 as uuid } from 'uuid'
import { PatchData } from './Data/PatchData';
import { createPromise, PromiseCallbacks } from './WorkerUtils';
import { ParseRequest, ParseResponse } from './assets/workers/GridParser';

import GridParser from './assets/workers/GridParser.ts?worker';

const gridParser = new GridParser();
const callbacksMap = new Map<string, PromiseCallbacks<PatchData>>();

gridParser.onmessage = (e: MessageEvent<ParseResponse>) => {
  const response = e.data;
  const request = response.request;

  const callbacks = callbacksMap.get(request.id);
  if (!callbacks) throw Error("Missing request callbacks");

  if (response.error) {
    callbacksMap.delete(request.id);
    callbacks.reject(response.error);
  }
  else if (response.data) {
    callbacksMap.delete(request.id);
    callbacks.resolve(response.data);
  }
  else {
    throw Error("Neither error or data returned from Worker");
  }
};

gridParser.onerror = (event) => {
  console.error("Unhandled Worker Error: " + event.message);
};

export function parseGrid(array: ArrayBuffer): Promise<PatchData> {
  const [promise, callbacks] = createPromise<PatchData>();
  const request: ParseRequest = { id: uuid(), array };

  callbacksMap.set(request.id, callbacks);
  gridParser.postMessage(request);

  return promise;
}
