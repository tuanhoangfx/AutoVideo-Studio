import { createHubAuthEnvFromVite, type HubAuthViteEnv } from '@tool-workspace/hub-identity';

export const hubAuthEnv = createHubAuthEnvFromVite(import.meta.env as HubAuthViteEnv);

export const { HUB_SUPABASE_URL, HUB_SUPABASE_ANON_KEY, isHubSupabaseConfigured } = hubAuthEnv;
