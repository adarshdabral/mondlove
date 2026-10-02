/**
 * Shrinks a photo in the browser before upload: phone photos are often 5–10 MB, the API accepts 3 MB.
 * Long edge capped at `max` px, re-encoded as JPEG.
 */
export async function prepareImage(file: File, max = 1600, quality = 0.82): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Use a JPEG, PNG or WebP photo')
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) throw new Error('That photo could not be read')
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', quality))
  if (!blob) throw new Error('That photo could not be processed')
  return blob
}
