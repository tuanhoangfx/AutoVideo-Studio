'use client';

import { ImageIcon, Timer, Wand2, X } from 'lucide-react';
import { sceneNarrationLabel } from '@/lib/narration-timeline';
import { coerceTransition } from '@/lib/pipeline-constants';
import {
  HubAccountDetailAdmScaffold,
  HubAdmClickEditField,
  HubAdmClickFilterField,
  HubAdmDetailNoteLineField,
  HubAdmGridSlotPad,
  HubToolDetailModal,
  HubToolDetailModalAccountFooter,
  HubToolDetailModalSecondaryAction,
  HubToolDetailSection,
  HubTocSectionNav,
  HUB_ACCOUNT_DETAIL_MAIN_SCROLL_ROOT,
  HUB_TOOL_DETAIL_SECTIONS_CLASS,
  hubAccountDetailShellClass,
  type HubTocNavItem,
} from '@/lib/hub-ui';
import { KEYFRAME_SCENE_COLUMN_STICKER } from '@/lib/keyframe-scene-column-meta';
import {
  keyframeEffectFilterOptions,
  keyframeTransitionFilterOptions,
} from '@/lib/keyframe-scene-option-display';
import type { LibraryImage } from './ImageLibrary';
import {
  type Effect,
  type ScriptLine,
  type Transition,
} from './ScriptPanel';

const SCENE_DETAIL_TOC: HubTocNavItem[] = [
  { id: 'kf-scene-scene', label: 'Scene', emoji: '🎬' },
  { id: 'kf-scene-timing', label: 'Timing', emoji: '⏱' },
  { id: 'kf-scene-fx', label: 'Effects', emoji: '✨' },
];

const DURATION_HEADER = {
  label: 'Duration',
  colClass: 'studio-keyframe-col--duration',
  role: 'created' as const,
  headerAlign: 'center' as const,
  headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.duration,
};

const START_HEADER = {
  label: 'Start',
  colClass: 'studio-keyframe-col--start',
  role: 'created' as const,
  headerAlign: 'center' as const,
  headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.start,
};

const TRANSITION_HEADER = {
  label: 'Transition',
  colClass: 'studio-keyframe-col--transition',
  role: 'role' as const,
  headerAlign: 'start' as const,
  headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.transition,
};

const EFFECT_HEADER = {
  label: 'Effect',
  colClass: 'studio-keyframe-col--effect',
  role: 'role' as const,
  headerAlign: 'start' as const,
  headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.effect,
};

const TRANSCRIPT_HEADER = {
  label: 'Transcript',
  colClass: 'studio-keyframe-col--transcript',
  role: 'email' as const,
  headerAlign: 'start' as const,
  headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.transcript,
};

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function safeDuration(raw: string, fallback: number) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function KeyframeSceneDetailModal({
  open,
  sceneIndex,
  line,
  image,
  startSec,
  durationSec,
  narrationScript,
  transcriptTimeSec,
  narrationCoverage,
  onClose,
  onChangeEffect,
  onChangeTransition,
  onChangeDuration,
  onChangeTranscript,
  imageDurationSec,
}: {
  open: boolean;
  sceneIndex: number;
  line: ScriptLine | null;
  image: LibraryImage | null;
  startSec: number;
  durationSec: number;
  narrationScript: string;
  transcriptTimeSec: number;
  narrationCoverage: ReturnType<typeof import('@/lib/narration-timeline').sceneNarrationCoverage>[number] | undefined;
  onClose: () => void;
  onChangeEffect: (effect: Effect) => void;
  onChangeTransition: (transition: Transition) => void;
  onChangeDuration: (durationSec: number) => void;
  onChangeTranscript: (text: string) => void;
  imageDurationSec: number;
}) {
  if (!line) return null;

  const derivedSlice = narrationCoverage
    ? sceneNarrationLabel(narrationCoverage, narrationScript, transcriptTimeSec)
    : '';

  return (
    <HubToolDetailModal
      open={open}
      onClose={onClose}
      title={`Scene S${sceneIndex + 1}`}
      headerIcon={ImageIcon}
      headerIconClassName="text-sky-300"
      shellClassName={hubAccountDetailShellClass()}
      scrollRootSelector={HUB_ACCOUNT_DETAIL_MAIN_SCROLL_ROOT}
      sectionIds={SCENE_DETAIL_TOC.map((item) => item.id)}
      toc={<HubTocSectionNav items={SCENE_DETAIL_TOC} admNav plainIcons scrollRootSelector={HUB_ACCOUNT_DETAIL_MAIN_SCROLL_ROOT} />}
      footer={
        <HubToolDetailModalAccountFooter
          onClose={onClose}
          leading={
            <HubToolDetailModalSecondaryAction label="Close" icon={X} onClick={onClose} close />
          }
        />
      }
    >
      <HubAccountDetailAdmScaffold
        panelId="kf-scene-detail"
        panelTitle="Scene detail"
        panelTitleEmoji="🎬"
        main={
          <div className={HUB_TOOL_DETAIL_SECTIONS_CLASS}>
            <HubToolDetailSection id="kf-scene-scene" title="Scene" icon={<ImageIcon size={14} />}>
              <div className="flex gap-3">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-white/30">
                      <ImageIcon size={18} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="hub-directory-body-value text-[var(--muted)]">Image #{line.image_index + 1}</div>
                  <HubAdmDetailNoteLineField
                    header={TRANSCRIPT_HEADER}
                    value={line.text}
                    onChange={onChangeTranscript}
                    name="kf-scene-transcript"
                    placeholder={derivedSlice || 'Scene transcript...'}
                    rows={4}
                  />
                </div>
              </div>
            </HubToolDetailSection>

            <HubToolDetailSection id="kf-scene-timing" title="Timing" icon={<Timer size={14} />}>
              <div className="hub-adm-form-row hub-adm-form-row--aligned">
                <HubAdmClickEditField
                  header={START_HEADER}
                  fieldLabel="Start"
                  value={fmtTime(startSec)}
                  onChange={() => {}}
                  disabled
                />
                <HubAdmClickEditField
                  header={DURATION_HEADER}
                  fieldLabel="Duration (s)"
                  value={String(line.durationSec ?? Math.round(durationSec))}
                  onChange={(value) => onChangeDuration(safeDuration(value, imageDurationSec))}
                  inputMode="numeric"
                />
                <HubAdmGridSlotPad filledCount={2} />
              </div>
            </HubToolDetailSection>

            <HubToolDetailSection id="kf-scene-fx" title="Effects" icon={<Wand2 size={14} />}>
              <div className="hub-adm-form-row hub-adm-form-row--aligned">
                <HubAdmClickFilterField
                  header={TRANSITION_HEADER}
                  fieldLabel="Transition"
                  filterKey="scene-detail-transition"
                  options={keyframeTransitionFilterOptions()}
                  value={coerceTransition(line.transition)}
                  onChange={(value) => onChangeTransition((value as Transition) || 'slide_left')}
                />
                <HubAdmClickFilterField
                  header={EFFECT_HEADER}
                  fieldLabel="Effect"
                  filterKey="scene-detail-effect"
                  options={keyframeEffectFilterOptions()}
                  value={line.effect ?? 'none'}
                  onChange={(value) => onChangeEffect((value as Effect) || 'none')}
                />
                <HubAdmGridSlotPad filledCount={2} />
              </div>
            </HubToolDetailSection>
          </div>
        }
      />
    </HubToolDetailModal>
  );
}
