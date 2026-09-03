import {
  applyStandardDirectoryColumnHints,
  createDirectoryColumnMetaHelpers,
  type HubDirectoryTableStaticColumn,
} from '@/lib/hub-ui';

const { col, toHubDirectoryColumnMeta } = createDirectoryColumnMetaHelpers();

export const VOICE_DIRECTORY_COLUMN_KEYS = ['gender', 'name', 'locale', 'tone'] as const;
export type VoiceDirectoryColumnKey = (typeof VOICE_DIRECTORY_COLUMN_KEYS)[number];

export const VOICE_DIRECTORY_COLUMN_META = {
  gender: col('', 'hub-users-col--icon studio-voice-col--gender', 'tools', 'col.directory.account', '3.25rem', {
    columnKind: 'compact',
    headerAlign: 'center',
    headerEmoji: '🧬',
  }),
  name: col('Voice', 'hub-users-col--name studio-voice-col--name', 'name', 'col.directory.name', '7rem', {
    headerEmoji: '🎙️',
    headerAlign: 'start',
  }),
  locale: col('Locale', 'hub-users-col--created studio-voice-col--locale', 'created', 'col.directory.region', '4.25rem', {
    columnKind: 'compact',
    headerAlign: 'center',
    headerEmoji: '🌐',
  }),
  tone: col('Tone', 'hub-users-col--email studio-voice-col--tone', 'email', 'col.directory.category', '7.5rem', {
    headerEmoji: '🎭',
  }),
} satisfies Record<VoiceDirectoryColumnKey, ReturnType<typeof col>>;

export function buildVoiceDirectoryColumns() {
  return toHubDirectoryColumnMeta(
    applyStandardDirectoryColumnHints(VOICE_DIRECTORY_COLUMN_META, {
      gender: 'Gender — female or male voice.',
      name: 'Voice — Azure neural voice name.',
      locale: 'Locale — language / region of the voice.',
      tone: 'Tone — speaking style tags.',
    }),
  );
}

export const VOICE_DIRECTORY_STATIC_COLUMNS: HubDirectoryTableStaticColumn[] = [
  {
    label: '',
    role: 'actions',
    colClass: 'hub-users-col--actions studio-voice-col--actions',
  },
];

/** Voice directory — SSOT default 20 rows per page (pager + split body scroll). */
export const VOICE_RAIL_PAGE_SIZE = 20;
