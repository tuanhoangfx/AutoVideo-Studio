import type { ReactNode } from 'react';
import { HubSplitWorkspaceScreen } from '@tool-workspace/hub-ui/templates/HubSplitWorkspaceScreen';
import { P0021_BRAND_ICON } from '@/lib/p0021-brand-icon';
import { AppTabHeader } from './AppTabHeader';

export type StudioHubChromeProps = {
  children: ReactNode;
};

/** Studio main — P0010 Video Lab / P0003 Profiles split chrome (HubSplitWorkspaceScreen SSOT). */
export function StudioHubChrome({ children }: StudioHubChromeProps) {
  return (
    <HubSplitWorkspaceScreen
      bodyClassName="studio-page flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      header={
        <AppTabHeader
          ariaLabel="AutoVideo Studio tab header"
          titleIcon={AutoVideoBrandIcon}
          titleIconClass="text-indigo-300"
          title="AutoVideo Studio"
        />
      }
    >
      {children}
    </HubSplitWorkspaceScreen>
  );
}

function AutoVideoBrandIcon({
  size = 16,
  className = '',
  'aria-hidden': ariaHidden,
}: {
  size?: string | number;
  className?: string;
  'aria-hidden'?: boolean;
}) {
  const dimension = typeof size === 'number' ? size : Number.parseInt(String(size), 10) || 16;

  return (
    <img
      src={P0021_BRAND_ICON}
      alt=""
      width={dimension}
      height={dimension}
      className={`shrink-0 ${className}`}
      aria-hidden={ariaHidden}
      decoding="async"
    />
  );
}
