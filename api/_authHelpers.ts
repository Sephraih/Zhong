import type { User } from '@supabase/supabase-js';

// An account whose own created_at meaningfully predates its Apple/Google identity's created_at
// existed before this sign-in — i.e. Supabase's auto-linking-by-verified-email attached this
// OAuth sign-in to a pre-existing account that already has its own email/password. A fresh
// OAuth signup creates both rows together, so the gap there is near-zero.
// Mirrors mobile/contexts/AuthContext.tsx's isPreExistingWebAccount + PRE_EXISTING_ACCOUNT_THRESHOLD_MS
// in the other repo — keep both in sync if this threshold or logic changes.
const PRE_EXISTING_ACCOUNT_THRESHOLD_MS = 60 * 1000;

// Whether this account currently has its own usable email/password — true for accounts with no
// OAuth identity at all, or whose OAuth identity was attached to a pre-existing account. False
// only for a fresh, OAuth-only signup with nothing to verify a password against.
export function accountHasPassword(user: User): boolean {
  const oauthIdentity = (user.identities ?? []).find((id) => ['apple', 'google'].includes(id.provider));
  if (!oauthIdentity) return true;
  const accountCreatedMs = new Date(user.created_at).getTime();
  const identityCreatedMs = oauthIdentity.created_at
    ? new Date(oauthIdentity.created_at).getTime()
    : accountCreatedMs;
  return accountCreatedMs < identityCreatedMs - PRE_EXISTING_ACCOUNT_THRESHOLD_MS;
}
