/** Shared Gender marks — table cell + FilterBar `iconSrc` (same SSOT as Locale flags). */
function genderMarkSvg(kind: 'female' | 'male'): string {
  const stroke = kind === 'female' ? '#f9a8d4' : '#7dd3fc';
  const fill = kind === 'female' ? 'rgba(244,114,182,0.12)' : 'rgba(56,189,248,0.12)';
  const rim = kind === 'female' ? 'rgba(249,168,212,0.4)' : 'rgba(125,211,252,0.4)';
  const mark =
    kind === 'female'
      ? '<circle cx="16" cy="11" r="5.2" fill="none" stroke="' +
        stroke +
        '" stroke-width="1.7"/><path d="M16 16.4v8.2M12.4 21.2h7.2" fill="none" stroke="' +
        stroke +
        '" stroke-width="1.7" stroke-linecap="round"/>'
      : '<circle cx="13.2" cy="18.2" r="5.2" fill="none" stroke="' +
        stroke +
        '" stroke-width="1.7"/><path d="M16.8 14.6 24.2 7.2M18.6 7.2h5.6v5.6" fill="none" stroke="' +
        stroke +
        '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>';
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
    '<circle cx="16" cy="16" r="15" fill="' +
    fill +
    '" stroke="' +
    rim +
    '" stroke-width="1.2"/>' +
    mark +
    '</svg>';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const GENDER_FILTER_ICON_SRC = {
  female: genderMarkSvg('female'),
  male: genderMarkSvg('male'),
} as const;

/** Neutral person glyph — Gender filter trigger + panel “Select shown” row (Locale 🌍 parity). */
export const GENDER_FILTER_TRIGGER_ICON_SRC = genderPersonTriggerSvg();

function genderPersonTriggerSvg(): string {
  const stroke = '#a5b4fc';
  const fill = 'rgba(99,102,241,0.12)';
  const rim = 'rgba(129,140,248,0.4)';
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
    '<circle cx="16" cy="16" r="15" fill="' +
    fill +
    '" stroke="' +
    rim +
    '" stroke-width="1.2"/>' +
    '<circle cx="16" cy="12.5" r="4.2" fill="none" stroke="' +
    stroke +
    '" stroke-width="1.7"/>' +
    '<path d="M10.5 24.5c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6" fill="none" stroke="' +
    stroke +
    '" stroke-width="1.7" stroke-linecap="round"/>' +
    '</svg>';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
