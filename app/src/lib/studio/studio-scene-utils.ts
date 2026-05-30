import type { Job } from '@/lib/api';
import type { ScriptLine } from '@/types/studio';

export function sourceFolderName(file: File) {
  const relativePath = 'webkitRelativePath' in file ? file.webkitRelativePath : '';
  const [folderName] = relativePath.split(/[\\/]/);
  return folderName || undefined;
}

export function buildSceneLines(
  imageIndexes: number[],
  existing: ScriptLine[],
  durationSec: number,
  nextTexts?: string[],
  forceTexts = false
): ScriptLine[] {
  return imageIndexes.map((imageIndex, order) => {
    const current = existing[order]?.image_index === imageIndex ? existing[order] : undefined;
    return {
      text: forceTexts ? (nextTexts?.[order] ?? '') : (current?.text ?? nextTexts?.[order] ?? ''),
      image_index: imageIndex,
      durationSec: current?.durationSec ?? durationSec,
      effect: current?.effect ?? 'none',
      transition: current?.transition ?? 'slide_left',
    };
  });
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;
  if (fromIndex >= items.length || toIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function jobDurationMismatchMs(job: Job | null): number | null {
  if (!job?.expected_duration_ms || job.output_duration_ms == null) return null;
  return Math.abs(job.output_duration_ms - job.expected_duration_ms);
}
