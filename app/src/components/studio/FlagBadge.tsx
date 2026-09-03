'use client';

import { HubCountryFlagBadge, countryCodeForLocale } from '@/lib/hub-ui';

/** Voice directory locale cell — HubCountryFlagBadge (flagsapi), same source as P0020 country cells. */
export function FlagBadge({ locale }: { locale: string }) {
  return (
    <HubCountryFlagBadge
      countryCode={countryCodeForLocale(locale)}
      size={16}
      title={locale}
    />
  );
}
