import type { Job } from '@/lib/api';
import { defaultSceneTransition } from '@/lib/pipeline-constants';
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
      transition: defaultSceneTransition(current?.transition),
    };
  });
}

export function sceneLinesEqual(a: ScriptLine[], b: ScriptLine[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      left.text !== right.text ||
      left.image_index !== right.image_index ||
      left.durationSec !== right.durationSec ||
      left.effect !== right.effect ||
      left.transition !== right.transition
    ) {
      return false;
    }
  }
  return true;
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;
  if (fromIndex >= items.length || toIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/** Fisher–Yates shuffle (returns new array). */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function jobDurationMismatchMs(job: Job | null): number | null {
  if (!job?.expected_duration_ms || job.output_duration_ms == null) return null;
  const delta = Math.abs(job.output_duration_ms - job.expected_duration_ms);
  const toleranceMs = Math.max(1500, Math.round(job.expected_duration_ms * 0.03));
  if (delta <= toleranceMs) return null;
  return delta;
}
