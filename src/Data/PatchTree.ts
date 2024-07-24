import { AreaBounds } from "./DataUtils";
import { Patch, PatchLevel } from "./Patch";

type PatchNode = {
  patch?: Patch
  nodes: PatchNode[]
  level: PatchLevel
};

/**
 * A tree structure to store patches in a quadtree-like structure.
 *
 * Contains 32 children nodes (patches) for each level-of-detail (PatchLevel).
 */
export class PatchTree {
  private root: PatchNode

  constructor() {
    this.root = {
      nodes: new Array(32),
      level: PatchLevel.A
    }
  }

  public push(patch: Patch) {
    const stack = [this.root];
    let current = stack.pop();

    for (; current; current = stack.pop()) {
      // If we are at the level, assign patch (only applies for level A)
      if (current.level === patch.info.level) {
        current.patch = patch;
        this.sortout(current);
        return;
      }

      // Assign patch to the correct node based on patchIndex
      if (current.level + 1 == patch.info.level) {
        const index = patch.info.index;

        if (!current.nodes[index]) {
          current.nodes[index] = {
            level: current.level + 1,
            nodes: new Array(32)
          }
        }

        current.nodes[index].patch = patch;
        this.sortout(current.nodes[index]);

        return;
      }

      // Create all subtrees
      for (let i = 0; i < 32; i++) {
        if (!current.nodes[i]) {
          current.nodes[i] = {
            level: current.level + 1,
            nodes: new Array(32)
          }
        }
      }

      const nodesWithPatches = current.nodes.filter(x => x.patch !== undefined);
      const nodesWithoutPatches = current.nodes.filter(x => x.patch === undefined);

      for (const node of nodesWithPatches) {
        const nodePatch = node.patch!;

        if (patch.bounds.inside(nodePatch.bounds)) {
          stack.push(node);
          continue;
        }
      }

      for (const node of nodesWithoutPatches) {
        /*
        * Unfortunately, if the patch is inside a node without any parent
        * we must first search for an existing patch with the same id,
        * otherwise there will be duplicate patches.
        *
        * Worst case scenario is that we have to search the entire tree,
        * which would be quite expensive. Although that should not happen,
        * as this case only happens when there is no parent patch
        * (for example when there are only D-level patches).
        */
        const existingNode = this.findNode(patch.id);
        if (existingNode) {
          existingNode.patch = patch;
          return;
        }

        // If we don't have the patch, we just assign to any empty node
        const emptyNode = PatchTree.getEmpty(node, patch.info.level);
        if (emptyNode) {
          emptyNode.patch = patch;
          return;
        }
      }
    }

    throw Error("Could not insert patch");
  }

  /**
   * Gets all patches inside the bounds with respect to the level.
   *
   * If there is no patch at that level, it will return the closest level.
  */
  public getArea(bounds: AreaBounds, level: PatchLevel) {
    const stack = [this.root];
    let current = stack.pop();

    const patches: Patch[] = [];

    for (; current; current = stack.pop()) {
      if (current.patch) {
        const intersect = current.patch.bounds.intersect(bounds);

        if (intersect && current.level === level) {
          patches.push(current.patch);
        }

        if (intersect && current.level !== level) {
          const lastLevel = current.nodes.every(x => x === undefined);

          if (lastLevel) {
            patches.push(current.patch);
            continue;
          }

          for (let i = 0; i < 32; i++) {
            if (current.nodes[i]) {
              stack.push(current.nodes[i]);
            }
          }
        }
      }
      else {
        for (let i = 0; i < 32; i++) {
          if (current.nodes[i]) {
            stack.push(current.nodes[i]);
          }
        }
      }
    }

    return patches;
  }

  public values(): Patch[] {
    const stack = [this.root];
    let current = stack.pop();

    const patches: Patch[] = [];

    for (; current; current = stack.pop()) {
      if (current.patch) {
        patches.push(current.patch);
      }

      for (let i = 0; i < 32; i++) {
        if (current.nodes[i]) {
          stack.push(current.nodes[i]);
        }
      }
    }

    return patches;
  }

  public findNode(id: string): PatchNode | undefined {
    const stack = [this.root];
    let current = stack.pop();

    for (; current; current = stack.pop()) {
      if (current.patch && current.patch.id === id) {
        return current;
      }

      for (let i = 0; i < 32; i++) {
        if (current.nodes[i]) {
          stack.push(current.nodes[i]);
        }
      }
    }

    return undefined;
  }

  /**
   * When a new patch is inserted, we need to sort out the subtree so
   * that all patches are in the correct nodes based on their patchIndex.
   *
   * Patches without parent patch are stored in a random empty node available.
   * Now, if the subtree just got a parent, we simply reinsert all its patches.
  */
  private sortout(node: PatchNode) {
    const patches = PatchTree.popPatches(node);
    for (const patch of patches) {
      this.push(patch);
    }
  }

  private static popPatches(node: PatchNode) {
    const stack = [...node.nodes];
    let current = stack.pop();

    const patches: Patch[] = [];

    for (; current; current = stack.pop()) {
      if (current.patch) {
        patches.push(current.patch);
        delete current.patch;
      }

      for (let i = 0; i < 32; i++) {
        if (current.nodes[i]) {
          stack.push(current.nodes[i]);
        }
      }
    }

    return patches;
  }

  private static getEmpty(node: PatchNode, level: PatchLevel): PatchNode | undefined {
    if (node.level === level && !node.patch) {
      return node;
    }

    if (node.level !== level && !node.patch) {
      for (let i = 0; i < 32; i++) {
        if (!node.nodes[i]) {
          node.nodes[i] = {
            level: node.level + 1,
            nodes: new Array(32)
          }
        }
        const emptyNode = this.getEmpty(node.nodes[i], level);
        if (emptyNode) return emptyNode;
      }
    }

    return undefined;
  }
}
