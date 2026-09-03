import {
  createDirectoryTableColumnPrefs,
  type DirectoryTableColumnItem,
} from '@/lib/hub-ui';
import {
  VOICE_DIRECTORY_COLUMN_KEYS,
  type VoiceDirectoryColumnKey,
} from '@/lib/voice-directory-meta';

export const VOICE_DIRECTORY_COLUMN_ITEMS: DirectoryTableColumnItem<VoiceDirectoryColumnKey>[] = [
  { key: 'gender', label: 'Gender', emoji: '⚧' },
  { key: 'name', label: 'Voice', emoji: '🎙️', required: true },
  { key: 'locale', label: 'Locale', emoji: '🌐' },
  { key: 'tone', label: 'Tone', emoji: '🎭' },
];

/** Rail default — hide Tone on narrow panel (workflow rail hides Created/Updated). */
export const DEFAULT_VOICE_RAIL_DIRECTORY_COLUMNS = new Set<VoiceDirectoryColumnKey>([
  'gender',
  'name',
  'locale',
]);

export const VOICE_RAIL_DIRECTORY_COLUMNS_CHANGE = 'p0021-voice-rail-directory-columns-change';

export const voiceRailDirectoryColumnPrefs = createDirectoryTableColumnPrefs({
  storageKey: 'p0021_voice_rail_directory_columns',
  items: VOICE_DIRECTORY_COLUMN_ITEMS,
  defaultKeys: DEFAULT_VOICE_RAIL_DIRECTORY_COLUMNS,
  changeEvent: VOICE_RAIL_DIRECTORY_COLUMNS_CHANGE,
});

export function readVoiceRailDirectoryColumns(): VoiceDirectoryColumnKey[] {
  const visible = voiceRailDirectoryColumnPrefs.read();
  return VOICE_DIRECTORY_COLUMN_KEYS.filter((key) => visible.has(key));
}
