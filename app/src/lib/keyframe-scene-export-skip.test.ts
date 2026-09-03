import { describe, expect, it } from 'vitest';
import {
  anyScenePartialExport,
  anySceneSkippedInExport,
  buildSceneExportStatusChecker,
  buildSceneSkippedInExportChecker,
  isSceneSkippedInExportIndex,
  partialSceneExportedSec,
  sceneExportStatusAtIndex,
} from './keyframe-scene-export-skip';

describe('keyframe scene export skip', () => {
  const starts = [0, 5, 10, 15, 20];
  const durations = [5, 5, 5, 5, 5];

  it('never skips in image or script-fit mode', () => {
    expect(sceneExportStatusAtIndex(4, starts, durations, 'image', 12)).toBe('included');
    expect(sceneExportStatusAtIndex(4, starts, durations, 'script-fit', 12)).toBe('included');
  });

  it('classifies skipped scenes starting at or after transcript end in script mode', () => {
    expect(sceneExportStatusAtIndex(0, starts, durations, 'script', 12)).toBe('included');
    expect(sceneExportStatusAtIndex(1, starts, durations, 'script', 12)).toBe('included');
    expect(sceneExportStatusAtIndex(2, starts, durations, 'script', 12)).toBe('partial');
    expect(sceneExportStatusAtIndex(3, starts, durations, 'script', 12)).toBe('skipped');
    expect(sceneExportStatusAtIndex(4, starts, durations, 'script', 12)).toBe('skipped');
  });

  it('marks partial when scene spans transcript cutoff', () => {
    expect(sceneExportStatusAtIndex(2, starts, durations, 'script', 11)).toBe('partial');
    expect(sceneExportStatusAtIndex(2, starts, durations, 'script', 15)).toBe('included');
  });

  it('returns included when transcript duration is zero', () => {
    expect(sceneExportStatusAtIndex(3, starts, durations, 'script', 0)).toBe('included');
  });

  it('buildSceneExportStatusChecker mirrors index helper', () => {
    const check = buildSceneExportStatusChecker(starts, durations, 'script', 12);
    expect(check(1)).toBe('included');
    expect(check(2)).toBe('partial');
    expect(check(3)).toBe('skipped');
  });

  it('buildSceneSkippedInExportChecker returns true only for skipped', () => {
    const check = buildSceneSkippedInExportChecker(starts, durations, 'script', 12);
    expect(check(2)).toBe(false);
    expect(check(3)).toBe(true);
  });

  it('isSceneSkippedInExportIndex stays backward compatible', () => {
    expect(isSceneSkippedInExportIndex(3, starts, 'script', 12, durations)).toBe(true);
    expect(isSceneSkippedInExportIndex(2, starts, 'script', 12, durations)).toBe(false);
  });

  it('partialSceneExportedSec returns clipped seconds before transcript end', () => {
    expect(partialSceneExportedSec(2, starts, durations, 12)).toBe(2);
    expect(partialSceneExportedSec(2, starts, durations, 15)).toBe(5);
    expect(partialSceneExportedSec(0, starts, durations, 3)).toBe(3);
  });

  it('anySceneSkippedInExport and anyScenePartialExport scan all scenes', () => {
    expect(anySceneSkippedInExport(5, starts, durations, 'script', 12)).toBe(true);
    expect(anyScenePartialExport(5, starts, durations, 'script', 12)).toBe(true);
    expect(anySceneSkippedInExport(5, starts, durations, 'script', 25)).toBe(false);
    expect(anyScenePartialExport(5, starts, durations, 'script', 25)).toBe(false);
    expect(anySceneSkippedInExport(5, starts, durations, 'image', 12)).toBe(false);
  });
});
