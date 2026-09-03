import type { KpiTileData } from '@tool-workspace/hub-ui/shell/KpiStrip';

export type StudioJobKpiNumbers = {
  active: number;
  done: number;
  error: number;
};

const STUDIO_JOB_KPI_ROWS: Array<{
  key: keyof StudioJobKpiNumbers;
  label: string;
  emojiGlyph: string;
  tone: NonNullable<KpiTileData['tone']>;
  pick: (k: StudioJobKpiNumbers) => number;
}> = [
  { key: 'active', label: 'Active', emojiGlyph: '⚡', tone: 'amber', pick: (k) => k.active },
  { key: 'done', label: 'Done', emojiGlyph: '✅', tone: 'emerald', pick: (k) => k.done },
  { key: 'error', label: 'Error', emojiGlyph: '⚠️', tone: 'rose', pick: (k) => k.error },
];

export const STUDIO_JOB_KPI_PREF_ITEMS = STUDIO_JOB_KPI_ROWS.map((row) => ({
  key: row.key,
  label: row.label,
}));

export const STUDIO_JOB_KPI_DEFAULT_KEYS = STUDIO_JOB_KPI_ROWS.map((row) => row.key);

export function buildStudioJobKpiItems(kpis: StudioJobKpiNumbers): KpiTileData[] {
  return STUDIO_JOB_KPI_ROWS.map((row) => ({
    prefKey: row.key,
    label: row.label,
    value: row.pick(kpis),
    emojiGlyph: row.emojiGlyph,
    tone: row.tone,
  }));
}
