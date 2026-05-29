/** Decode JWT header without verifying signature (client-side session hygiene only). */
export function getJwtHeader(token: string): Record<string, unknown> | null {
  try {
    const [headerB64] = token.split('.');
    if (!headerB64) return null;
    const normalized = headerB64.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '='));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** App login/register tokens are HS256 signed with SECRET_KEY. */
export function isLocalAppToken(token: string): boolean {
  const header = getJwtHeader(token);
  return header?.alg === 'HS256';
}
