import type { NavStructureEntry } from '@tool-workspace/hub-ui/shell/nav-sidebar-structure';
import { Film, Settings2 } from 'lucide-react';

export type P0021Screen = 'studio' | 'system';

export const P0021_NAV_SUBNAV_PREFIX = 'p0021';
export const P0021_NAV_GROUP_IDS: string[] = [];

/** Flat Hub sidebar — P0003 / P0004 golden (`HubSidebarNavList`). */
export const P0021_NAV_STRUCTURE: NavStructureEntry<P0021Screen>[] = [
  { kind: 'screen', screen: 'studio', label: 'Studio', icon: Film, iconTone: 'indigo' },
  { kind: 'screen', screen: 'system', label: 'System', icon: Settings2, iconTone: 'amber' },
];

export function p0021ScreenFromPath(pathname: string): P0021Screen {
  return pathname.startsWith('/system') ? 'system' : 'studio';
}

export function p0021PathFromScreen(screen: P0021Screen): string {
  return screen === 'system' ? '/system' : '/studio';
}
