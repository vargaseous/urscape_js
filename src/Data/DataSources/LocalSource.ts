import { DataSource } from "../DataSource";
import { AreaBounds } from "../DataUtils";
import { PatchInfo, Patch } from "../Patch";
import { parseInfo } from "./StaticSource";
import { parseGrid } from "../../Workers";

export class LocalSource implements DataSource {
  private opfs: Promise<FileSystemDirectoryHandle>;

  constructor() {
    this.opfs = navigator.storage.getDirectory();
  }

  private async getHandle(): Promise<FileSystemDirectoryHandle> {
    const handle = await this.opfs;

    if (handle === undefined) {
      throw Error("OPFS is not supported by this browser");
    }

    return handle;
  }

  public async storePatch(info: PatchInfo, array: ArrayBuffer): Promise<void> {
    const handle = await this.getHandle();

    const dataFileHandle = await handle.getFileHandle(info.filename, { create: true });
    const writableDataStream = await dataFileHandle.createWritable();
    await writableDataStream.write({ type: "write", data: array });
    await writableDataStream.close();
  }

  public async getAvailablePatches(): Promise<PatchInfo[]> {
    const handle = await this.getHandle();
    const patchInfos: PatchInfo[] = [];

    for await (const entry of handle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.bin')) {
        const fileHandle = await handle.getFileHandle(entry.name);
        const info = parseInfo(fileHandle.name);
        if (info) patchInfos.push(info);
      }
    }

    return patchInfos;
  }

  public async getPatch(info: PatchInfo): Promise<Patch> {
    const handle = await this.getHandle();

    const dataFile = await handle.getFileHandle(info.filename);
    const dataContent = await dataFile.getFile().then(f => f.arrayBuffer());

    const data = await parseGrid(dataContent);

    const bounds = new AreaBounds(data.bounds);
    const patch = new Patch(this, info, bounds);
    patch.data = data;

    return patch;
  }
}
