/** Shared studio editor types — lib modules import from here (not @/components/studio). */

export type Effect = 'auto' | 'zoom_in' | 'zoom_out' | 'pan_right' | 'pan_left' | 'flash' | 'sparkle' | 'random' | 'none';
export type Transition = 'slide_left' | 'slide_right' | 'fade' | 'zoom' | 'random' | 'none';

export type ScriptLine = {
  text: string;
  image_index: number;
  durationSec?: number;
  effect?: Effect;
  transition?: Transition;
};

export type LibraryImage = {
  file: File;
  url: string;
  used: boolean;
  sourceFolder?: string;
  sourceKind?: 'local' | 'drive';
  driveFolderId?: string;
  driveFileId?: string;
  thumbnailUrl?: string;
  cacheStatus?: 'cached' | 'downloaded';
};

export type LibraryImageInput = Pick<
  LibraryImage,
  'file' | 'sourceFolder' | 'sourceKind' | 'driveFolderId' | 'driveFileId' | 'thumbnailUrl' | 'cacheStatus'
>;

export type SequenceScene = {
  text: string;
  imageUrl: string;
  effect?: string;
  durationSec?: number;
  transition?: string;
};

export type SequenceTiming = {
  durations: number[];
  waveforms: number[][];
  total: number;
};
