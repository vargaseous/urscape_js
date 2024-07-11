import { makeAutoObservable, observable } from "mobx"
import { v4 as uuid } from "uuid";
import { Site } from "./Site";
import { Patch } from "./Patch";
import { Color } from "../Map/Color";

export class DataLayer {
  public site: Site;
  public id: string;
  public name: string;
  public tint: Color;
  public patches: Patch[];
  public selected: boolean;

  constructor(site: Site, name: string, tint: Color) {
    this.site = site;
    this.id = uuid();
    this.name = name;
    this.tint = tint;
    this.patches = [];
    this.selected = false;

    makeAutoObservable(this, {
      patches: observable.shallow,
      getMinMaxValue: false // exclude
    });
  }

  public get active(): boolean {
    return !this.hidden && this.selected;
  }

  public get hidden(): boolean {
    return !this.site.selected;
  }

  public toggleSelect() {
    this.selected = !this.selected;
  }

  public getMinMaxValue(): [number, number] {
    let min = +Infinity;
    let max = -Infinity;

    for (const patch of this.patches) {
      if (!patch.data) continue;
      min = patch.data.minValue < min ? patch.data.minValue : min;
      max = patch.data.maxValue > max ? patch.data.maxValue : max;
    }

    return [min, max];
  }
}
