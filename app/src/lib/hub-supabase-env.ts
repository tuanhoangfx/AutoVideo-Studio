import { createHubAuthEnvFromVite } from '@tool-workspace/hub-identity';

export const hubAuthEnv = createHubAuthEnvFromVite(
  {
    NEXT_PUBLIC_HUB_AUTH_URL: process.env.NEXT_PUBLIC_HUB_AUTH_URL,
    NEXT_PUBLIC_HUB_AUTH_ANON_KEY: process.env.NEXT_PUBLIC_HUB_AUTH_ANON_KEY,
    NEXT_PUBLIC_HUB_SUPABASE_URL: process.env.NEXT_PUBLIC_HUB_SUPABASE_URL,
    NEXT_PUBLIC_HUB_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_HUB_SUPABASE_ANON_KEY,
  },
);

export const { HUB_SUPABASE_URL, HUB_SUPABASE_ANON_KEY, isHubSupabaseConfigured } = hubAuthEnv;
