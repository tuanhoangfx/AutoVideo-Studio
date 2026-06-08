export type NormalizeHubAuthErrorOptions = {
  /** Mention Tool Hub (P0004) in invalid-credentials copy */
  toolHubHint?: boolean;
  /** Extra network / quota messages for dual-workspace tools */
  dualWorkspace?: boolean;
};

export function normalizeHubAuthError(raw: string, opts: NormalizeHubAuthErrorOptions = {}) {
  const msg = String(raw || "").trim();
  const lower = msg.toLowerCase();
  if (lower.includes("rate limit")) return "Temporary sign-in issue. Please try again in a moment.";
  if (lower.includes("invalid login credentials")) {
    return opts.toolHubHint
      ? "Incorrect user ID/email or password. Use the same credentials as Tool Hub (P0004)."
      : "Incorrect user ID/email or password.";
  }
  if (lower.includes("user already registered")) return "This user ID or email is already registered.";
  if (opts.dualWorkspace) {
    if (lower.includes("exceed_egress_quota") || lower.includes("egress_quota")) {
      return "Workspace Supabase is paused (egress quota exceeded). Restore the project in Supabase Dashboard → Billing.";
    }
    if (msg === "Failed to fetch" || lower.includes("networkerror") || lower.includes("load failed")) {
      return "Cannot reach Tool Hub or workspace Supabase. Check env URLs and project status.";
    }
  } else if (msg === "Failed to fetch" || lower.includes("networkerror")) {
    return "Cannot reach Tool Hub identity. Check network and Supabase project status.";
  }
  return msg || "Sign-in failed. Please try again.";
}
