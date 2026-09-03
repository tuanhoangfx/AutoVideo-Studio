import {
  applyStandardDirectoryColumnHints,
  createDirectoryColumnMetaHelpers,
  type HubDirectoryTableStaticColumn,
} from '@/lib/hub-ui';

const { col, toHubDirectoryColumnMeta } = createDirectoryColumnMetaHelpers();

export const BGM_DIRECTORY_COLUMN_KEYS = ['mood', 'name', 'genre', 'duration'] as const;
export type BgmDirectoryColumnKey = (typeof BGM_DIRECTORY_COLUMN_KEYS)[number];

export const BGM_DIRECTORY_COLUMN_META = {
  mood: col('', 'hub-users-col--icon studio-bgm-col--mood', 'tools', 'col.directory.category', '3.25rem', {
    columnKind: 'compact',
    headerAlign: 'center',
    headerEmoji: '🎵',
  }),
  name: col('Track', 'hub-users-col--name studio-bgm-col--name', 'name', 'col.directory.name', '7rem', {
    headerEmoji: '🎧',
  }),
  genre: col('Genre', 'hub-users-col--created studio-bgm-col--genre', 'created', 'col.directory.category', '5rem', {
    headerEmoji: '🎸',
  }),
  duration: col('Length', 'hub-users-col--email studio-bgm-col--duration', 'email', 'col.directory.updated', '4rem', {
    columnKind: 'compact',
    headerAlign: 'center',
    headerEmoji: '⏱️',
  }),
} satisfies Record<BgmDirectoryColumnKey, ReturnType<typeof col>>;

export function buildBgmDirectoryColumns() {
  return toHubDirectoryColumnMeta(
    applyStandardDirectoryColumnHints(BGM_DIRECTORY_COLUMN_META, {
      mood: 'Mood — calm, upbeat, cinematic, or lo-fi.',
      name: 'Track — catalog title from the BGM source.',
      genre: 'Genre — ambient, electronic, acoustic, or corporate.',
      duration: 'Length — preview duration in minutes:seconds.',
    }),
  );
}

export const BGM_DIRECTORY_STATIC_COLUMNS: HubDirectoryTableStaticColumn[] = [
  {
    label: '',
    role: 'actions',
    colClass: 'hub-users-col--actions studio-bgm-col--actions',
  },
];

export const BGM_RAIL_PAGE_SIZE = 20;

export const BGM_DIRECTORY_COLUMN_ITEMS = BGM_DIRECTORY_COLUMN_KEYS.map((key) => ({
  key,
  label: BGM_DIRECTORY_COLUMN_META[key].label || key,
}));
