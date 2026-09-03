import type { FilterDef, FilterValues } from '@/lib/hub-ui';
import { colHint, withFilterLabelHints } from '@/lib/hub-ui';
import { type Effect, type Transition } from '@/components/studio/ScriptPanel';
import { coerceTransition } from '@/lib/pipeline-constants';
import type { SceneExportStatus } from '@/lib/keyframe-scene-export-skip';
import type { ScriptLine } from '@/types/studio';
import {
  keyframeEffectFilterOptions,
  keyframeExportBoundaryFilterOptions,
  keyframeTransitionFilterOptions,
} from './keyframe-scene-option-display';

export function buildKeyframeSceneFilters(): FilterDef[] {
  const filters: FilterDef[] = [
    {
      key: 'transition',
      label: 'Transition',
      showAllLabel: false,
      triggerEmoji: '↔️',
      suppressDefaultTriggerIcon: true,
      options: keyframeTransitionFilterOptions(),
    },
    {
      key: 'effect',
      label: 'Effect',
      showAllLabel: false,
      triggerEmoji: '✨',
      suppressDefaultTriggerIcon: true,
      options: keyframeEffectFilterOptions(),
    },
    {
      key: 'exportSkipped',
      label: 'Export',
      showAllLabel: false,
      triggerEmoji: '⏭️',
      suppressDefaultTriggerIcon: true,
      options: keyframeExportBoundaryFilterOptions(),
    },
  ];
  return withFilterLabelHints(filters, (_key, label) =>
    colHint(label, `${label} filter for the keyframe scene directory.`),
  );
}

export function matchesKeyframeSceneFilters(
  line: ScriptLine,
  values: FilterValues,
  ctx?: { index?: number; sceneExportStatus?: (index: number) => SceneExportStatus },
): boolean {
  const transitionFilters = values.transition ?? [];
  if (
    transitionFilters.length > 0 &&
    !transitionFilters.includes(coerceTransition(line.transition) as string)
  ) {
    return false;
  }

  const effectFilters = values.effect ?? [];
  const effect = (line.effect ?? 'none') as string;
  if (effectFilters.length > 0 && !effectFilters.includes(effect)) {
    return false;
  }

  const exportSkippedFilters = values.exportSkipped ?? [];
  if (exportSkippedFilters.length > 0 && ctx?.sceneExportStatus && ctx.index != null) {
    const status = ctx.sceneExportStatus(ctx.index);
    const wantsSkipped = exportSkippedFilters.includes('skipped');
    const wantsIncluded = exportSkippedFilters.includes('included');
    const wantsPartial = exportSkippedFilters.includes('partial');
    if (wantsSkipped && status !== 'skipped') return false;
    if (wantsPartial && status !== 'partial') return false;
    if (wantsIncluded && status !== 'included') return false;
  }

  return true;
}

export function keyframeSceneFilterValuesToState(values: FilterValues) {
  return {
    transitionFilters: (values.transition ?? []) as Transition[],
    effectFilters: (values.effect ?? []) as Effect[],
  };
}

export function keyframeSceneStateToFilterValues(
  transitionFilters: Transition[],
  effectFilters: Effect[],
): FilterValues {
  return {
    transition: transitionFilters,
    effect: effectFilters,
  };
}
