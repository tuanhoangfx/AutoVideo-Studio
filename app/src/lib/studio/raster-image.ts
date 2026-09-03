/** FFmpeg-safe raster uploads — excludes .ico/.svg (browser reports them as image/*). */
const RASTER_EXT = /\.(jpe?g|png|webp|gif|bmp)$/i;

export const RASTER_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp';

export function isRasterImageFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith('.ico') || name.endsWith('.svg') || name.endsWith('.cur')) return false;
  if (file.type === 'image/x-icon' || file.type === 'image/vnd.microsoft.icon') return false;
  if (file.type.startsWith('image/')) return true;
  return RASTER_EXT.test(name);
}

export function filterRasterImageFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter(isRasterImageFile);
}
