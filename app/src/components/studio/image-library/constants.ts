import { Cloud, HardDrive, LayoutGrid } from 'lucide-react';

export const LAST_LOCAL_FOLDER_ID_KEY = 'p0021:studio:last-local-folder-id';

export const LIBRARY_SOURCE_FILTERS = [
  { id: 'all' as const, label: 'All', icon: LayoutGrid, iconClass: 'text-white/55' },
  { id: 'local' as const, label: 'Local', icon: HardDrive, iconClass: 'text-indigo-300/90' },
  { id: 'drive' as const, label: 'Drive', icon: Cloud, iconClass: 'text-cyan-300/90' },
];

