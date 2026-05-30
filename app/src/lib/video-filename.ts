import type { Job } from '@/lib/api';
import type { VideoNameTemplate } from '@/lib/studio-export-settings';
import { DEFAULT_STUDIO_EXPORT_SETTINGS } from '@/lib/studio-export-settings';
import { formatJobDateTimeFilePart } from '@/lib/job-datetime-label';

function safeFilePart(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

export function buildVideoFilename({
  job,
  topic = '',
  imagesCount,
  template = DEFAULT_STUDIO_EXPORT_SETTINGS.videoNameTemplate ?? 'time-date-yy-images',
  exportIndex = 1,
}: {
  job: Job;
  topic?: string;
  imagesCount: number;
  template?: VideoNameTemplate;
  /** 1-based export attempt on this project tab (adds suffix when > 1). */
  exportIndex?: number;
}) {
  const stampIso = job.completed_at ?? job.created_at ?? new Date().toISOString();
  const timeDate = formatJobDateTimeFilePart(stampIso);
  const dateTime = (() => {
    const d = new Date(stampIso);
    if (Number.isNaN(d.getTime())) return timeDate;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}-${mo}-${yy} ${hh}-${mm}`;
  })();
  const imagesPart = `${Math.max(0, imagesCount)}img`;
  const topicPart = safeFilePart(topic || 'video');
  const jobPart = safeFilePart(job.id);
  const versionSuffix = exportIndex > 1 ? ` v${exportIndex}` : '';

  let base: string;
  switch (template) {
    case 'time-date-yy-images':
      base = `${timeDate} ${imagesPart}`;
      break;
    case 'time-date-yy':
      base = timeDate;
      break;
    case 'date-yy-time':
      base = dateTime;
      break;
    case 'topic-time-date':
      base = `${topicPart} ${timeDate}`;
      break;
    case 'jobid':
      base = jobPart;
      break;
    default:
      base = `${timeDate} ${imagesPart}`;
  }

  return safeFilePart(`${base}${versionSuffix}`);
}
