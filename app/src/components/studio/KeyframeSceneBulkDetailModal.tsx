'use client';

import { useMemo, useState } from 'react';
import { Tags } from 'lucide-react';
import {
  HubAccountDetailAdmScaffold,
  HubAdmGridSlotPad,
  HubBulkDetailField,
  HubToolDetailModal,
  HubToolDetailModalAccountFooter,
  HubToolDetailModalPrimaryAction,
  groupHubBulkDetailFieldsForRows,
  hubAccountDetailShellClass,
} from '@/lib/hub-ui';
import { KEYFRAME_SCENE_BULK_DETAIL_FIELDS } from '@/lib/keyframe-scene-bulk-detail-meta';
import type { Effect, Transition } from './ScriptPanel';

export type KeyframeSceneBulkDetailPatch = {
  durationSec?: number;
  transition?: Transition;
  effect?: Effect;
};

type BulkFieldValues = Record<string, string>;

export function KeyframeSceneBulkDetailModal({
  open,
  sceneIndexes,
  onClose,
  onApply,
}: {
  open: boolean;
  sceneIndexes: number[];
  onClose: () => void;
  onApply: (patch: KeyframeSceneBulkDetailPatch) => void;
}) {
  const [values, setValues] = useState<BulkFieldValues>({});

  const count = sceneIndexes.length;
  const title = useMemo(
    () => (count === 1 ? `Scene S${sceneIndexes[0]! + 1}` : `Bulk Detail · ${count} scenes`),
    [count, sceneIndexes],
  );

  const rows = useMemo(
    () => groupHubBulkDetailFieldsForRows(KEYFRAME_SCENE_BULK_DETAIL_FIELDS),
    [],
  );

  const setField = (key: string, value: string) => {
    setValues((prev) => {
      const next = { ...prev };
      if (!value.trim()) delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const handleApply = () => {
    const patch: KeyframeSceneBulkDetailPatch = {};
    const durationRaw = values.durationSec?.trim() ?? '';
    if (durationRaw) {
      const duration = Number(durationRaw);
      if (Number.isFinite(duration) && duration > 0) {
        patch.durationSec = Math.round(duration);
      }
    }
    if (values.transition?.trim()) patch.transition = values.transition as Transition;
    if (values.effect?.trim()) patch.effect = values.effect as Effect;
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    onApply(patch);
    setValues({});
    onClose();
  };

  const handleClose = () => {
    setValues({});
    onClose();
  };

  return (
    <HubToolDetailModal
      open={open}
      onClose={handleClose}
      title={title}
      headerIcon={Tags}
      headerIconClassName="text-sky-300"
      shellClassName={hubAccountDetailShellClass()}
      footer={
        <HubToolDetailModalAccountFooter
          onClose={handleClose}
          saveSlot={
            <HubToolDetailModalPrimaryAction label="Apply" onClick={handleApply} disabled={count === 0} />
          }
        />
      }
    >
      <HubAccountDetailAdmScaffold
        panelId="kf-scene-bulk-detail"
        panelTitle="Bulk edit"
        panelTitleEmoji="🎬"
        main={
          <div className="hub-adm-form-stack">
            <p className="px-1 text-xs text-[var(--muted)]">
              Leave fields empty to keep existing values on selected scenes.
            </p>
            {rows.map((row) => (
              <div
                key={row.key}
                className={`hub-adm-form-row hub-adm-form-row--aligned${row.single ? ' hub-adm-form-row--single' : ''}`}
              >
                {row.fields.map((field) => (
                  <HubBulkDetailField
                    key={field.key}
                    def={field}
                    value={values[field.key] ?? ''}
                    onChange={(value) => setField(field.key, value)}
                  />
                ))}
                {row.single ? null : <HubAdmGridSlotPad filledCount={row.fields.length} />}
              </div>
            ))}
          </div>
        }
      />
    </HubToolDetailModal>
  );
}
