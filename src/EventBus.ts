/*
  --- DISCLAIMER ---

  This EventBus is to be used sparingly to emit and listen to static events.
  I recommend using MobX's `autorun` and `reaction` instead for most use-cases.

  For example, in 'Map.tsx' we use `mapScreenshot` event to save a screenshot of the map.
  This is a good use-case for EventBus because the event is triggered by a button click.
  The event is not triggered by a change in the state of the map. It is a static event.

  ------------------

  Inspired by https://www.typescriptbites.io/articles/pub-sub-in-typescript
*/

import { runInAction } from "mobx";

export class EventBus<T extends Record<string, (...args: never[]) => void>> {
  private eventMap = {} as Record<keyof T, Set<(...args: never[]) => void>>;

  public emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
    (this.eventMap[event] ?? []).forEach((cb) => cb(...args));
  }

  public emitAction<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
    (this.eventMap[event] ?? []).forEach((cb) =>
      runInAction(() => cb(...args))
    );
  }

  public on<K extends keyof T>(event: K, callback: T[K]) {
    if (!this.eventMap[event]) {
      this.eventMap[event] = new Set();
    }

    this.eventMap[event].add(callback);

    return () => this.off(event, callback);
  }

  public off<K extends keyof T>(event: K, callback: T[K]) {
    if (!this.eventMap[event]) {
      return;
    }

    this.eventMap[event].delete(callback);
  }
}

type EventTypes<T> = T extends EventBus<infer U> ? keyof U : never

export const eventBus = new EventBus<{
  mapUpdate: () => void;
  mapRedraw: () => void;
  mapScreenshot: () => void;
  mapExportTIFF: () => void;
}>();

/**
 * FIXME: Decorator causes `"this" is undefined` error
 * @deprecated This decorator should not be used. Use `eventBus.on` instead.
 */
export function subscribe(event: EventTypes<typeof eventBus>) {
  return function(target: object, _name: string, descriptor: PropertyDescriptor) {
    eventBus.on(event, descriptor.value.bind(target));
  };
}
