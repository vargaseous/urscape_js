import { createAtom, IAtom } from "mobx";
import { AreaBounds } from "./DataUtils";
import { Patch, PatchLevel } from "./Patch";

/**
 * A tree structure to store patches in a quadtree-like structure.
 *
 * Contains 32 children nodes (patches) for each level-of-detail (PatchLevel).
 */
export class PatchTree {
  private level: PatchLevel
  private nodes: PatchTree[]
  private bounds: AreaBounds
  private patch?: Patch

  constructor() {
    this.level = PatchLevel.A;
    this.nodes = new Array(32);
    this.bounds = AreaBounds.inf();
  }

  public push(patch: Patch) {
    const stack: PatchTree[] = [this];
    let current = stack.pop();

    for (; current; current = stack.pop()) {
      if (patch.bounds)
        current.bounds.add(patch.bounds);

      if (patch.info.level === current.level) {
        if (current.patch && current.patch.id !== patch.id) {
          console.error("Patch already exists at this level");
          return;
        }

        current.patch = patch;
        return;
      }

      const index = Math.floor(
        patch.info.index / Math.pow(32, patch.info.level - current.level - 1)
      );

      let node = current.nodes[index];

      if (!node) {
        node = new PatchTree();
        node.level = current.level + 1;
        current.nodes[index] = node;
      }

      stack.push(node);
    }
  }

  /**
   * Gets all patches inside the bounds with respect to the level.
   *
   * If there is no patch at that level, it will return the closest level.
  */
  public getArea(bounds: AreaBounds, level: PatchLevel): Patch[] {
    const patches: Patch[] = [];

    const stack: PatchTree[] = [this];
    let node = stack.pop();

    for (; node; node = stack.pop()) {
      if (node.bounds.intersect(bounds)) {
        if (node.level >= level && node.patch) {
          patches.push(node.patch);
          continue;
        }

        for (const child of node.nodes) {
          if (child) {
            stack.push(child);
          }
        }
      }
    }

    if (patches.length === 0 && level > PatchLevel.A) {
      return this.getArea(bounds, level - 1);
    }

    return patches;
  }

  /**
   * Returns all patches in the tree.
   */
  public values() {
    const patches: Patch[] = [];

    const stack: PatchTree[] = [this];
    let node = stack.pop();

    for (; node; node = stack.pop()) {
      if (node.patch) {
        patches.push(node.patch);
      }
      for (const child of node.nodes) {
        if (child) {
          stack.push(child);
        }
      }
    }

    return patches;
  }
}

export class ObservablePatchTree extends PatchTree {
  private atom: IAtom;

  constructor() {
    super();
    this.atom = createAtom("PatchTree");
  }

  public push(patch: Patch) {
    super.push(patch);
    this.atom.reportChanged();
  }

  public getArea(bounds: AreaBounds, level: PatchLevel) {
    const patches = super.getArea(bounds, level);
    this.atom.reportObserved();
    return patches;
  }

  public values() {
    const patches = super.values();
    this.atom.reportObserved();
    return patches;
  }
}
