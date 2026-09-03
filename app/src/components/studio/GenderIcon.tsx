'use client';

import { GENDER_FILTER_ICON_SRC } from '@/lib/gender-filter-icons';

/** Voice directory gender cell — same SVG `iconSrc` as the Gender filter. */
export function GenderIcon({ gender }: { gender: string }) {
  const isFemale = gender === '♀';
  return (
    <img
      src={isFemale ? GENDER_FILTER_ICON_SRC.female : GENDER_FILTER_ICON_SRC.male}
      alt=""
      title={isFemale ? 'Female' : 'Male'}
      aria-hidden
      className="h-4 w-4 shrink-0"
      draggable={false}
    />
  );
}
