export interface PromiseCallbacks<T> {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: Error) => void;
}

export function createPromise<T>(): [Promise<T>, PromiseCallbacks<T>] {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return [promise, { resolve: resolve!, reject: reject! }];
}
