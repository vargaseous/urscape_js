import { makeAutoObservable } from "mobx"
import { DataLayer } from "./DataLayer";
import { AreaBounds } from "./DataUtils";

export class Site {
  public name: string;
  public bounds: AreaBounds;
  public layers: DataLayer[];
  public selected: boolean;

  constructor(name: string) {
    this.name = name;
    this.bounds = AreaBounds.inf();
    this.layers = [];
    this.selected = false;
    makeAutoObservable(this);
  }
}
