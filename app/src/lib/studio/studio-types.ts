import type { VideoNameTemplate } from '@/lib/studio-export-settings';

export type StudioAspect = '9:16' | '16:9' | '1:1';
export type StudioRightPanel = 'voice' | 'subtitle' | 'music';

export type StudioDownloadRecord = {
  id: string;
  filename: string;
  url: string;
  target: string;
  size: number;
  at: number;
};

export const VIDEO_NAME_TEMPLATES: { value: VideoNameTemplate; label: string }[] = [
  { value: 'time-date-yy', label: 'hh:mm:ss dd/mm/yy' },
  { value: 'time-date-yy-images', label: 'hh:mm:ss dd/mm/yy + images' },
  { value: 'date-yy-time', label: 'dd/mm/yy hh:mm' },
  { value: 'topic-time-date', label: 'topic + hh:mm:ss dd/mm/yy' },
  { value: 'jobid', label: 'job id' },
];
