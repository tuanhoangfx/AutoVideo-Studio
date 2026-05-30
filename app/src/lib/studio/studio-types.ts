import type { StudioDownloadState } from '@/lib/studio-editor-snapshot';
import type { VideoNameTemplate } from '@/lib/studio-export-settings';

export type StudioAspect = '9:16' | '16:9' | '1:1';
export type StudioRightPanel = 'voice' | 'subtitle' | 'music';
export type StudioDownloadStateLocal = StudioDownloadState;

export type StudioDownloadRecord = {
  id: string;
  filename: string;
  url: string;
  target: string;
  size: number;
  at: number;
};

export const VIDEO_NAME_TEMPLATES: { value: VideoNameTemplate; label: string }[] = [
  { value: 'time-date-yy-images', label: 'hh:mm dd/mm/yy + images' },
  { value: 'time-date-yy', label: 'hh:mm dd/mm/yy' },
  { value: 'date-yy-time', label: 'dd/mm/yy hh:mm' },
  { value: 'topic-time-date', label: 'topic + hh:mm dd/mm' },
  { value: 'jobid', label: 'job id' },
];
