import { createHubSupabaseEnv } from '@tool-workspace/hub-identity';

export const { HUB_SUPABASE_URL, HUB_SUPABASE_ANON_KEY, isHubSupabaseConfigured } = createHubSupabaseEnv({
  url: process.env.NEXT_PUBLIC_HUB_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_HUB_SUPABASE_ANON_KEY,
  defaultUrl: 'https://fmnrafpzctuhxjaaomzt.supabase.co',
});
