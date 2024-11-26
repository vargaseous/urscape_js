export function equalSets<T>(a: Set<T>, b: Set<T>) {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export async function blobToImageData(blob: Blob) {
  const blobUrl = URL.createObjectURL(blob);

  const img = await new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = err => reject(err);
      img.src = blobUrl;
    }
  );

  URL.revokeObjectURL(blobUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
