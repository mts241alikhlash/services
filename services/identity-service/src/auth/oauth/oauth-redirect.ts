export function parseRedirectAllowlist(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

export function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function resolveRedirectOrigin(
  redirect: string | undefined,
  allowlist: string[],
): string | null {
  if (redirect) {
    const origin = normalizeOrigin(redirect)
    if (origin && allowlist.includes(origin)) {
      return origin
    }
  }
  return null
}

export type OAuthIntent = 'signin' | 'signup'

export type OAuthRealm = 'applicant' | 'sso'

export type OAuthOutcome =
  'signup-created' | 'signup-existing' | 'signup-disabled' | 'staff-account'

export function encodeOAuthState(
  origin: string,
  intent: OAuthIntent,
  realm: OAuthRealm = 'applicant',
): string {
  return Buffer.from(JSON.stringify({ origin, intent, realm })).toString(
    'base64url',
  )
}

export function decodeOAuthState(state: string | undefined | null): {
  origin: string | null
  intent: OAuthIntent
  realm: OAuthRealm
} {
  if (!state) {
    return { origin: null, intent: 'signin', realm: 'applicant' }
  }

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(state, 'base64url').toString(),
    )
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      typeof (parsed as { origin?: unknown }).origin === 'string'
    ) {
      const intent = (parsed as { intent?: unknown }).intent
      return {
        origin: (parsed as { origin: string }).origin,
        intent: intent === 'signup' ? 'signup' : 'signin',
        realm:
          (parsed as { realm?: unknown }).realm === 'sso' ? 'sso' : 'applicant',
      }
    }
  } catch {
    return { origin: state, intent: 'signin', realm: 'applicant' }
  }

  return { origin: state, intent: 'signin', realm: 'applicant' }
}

export function buildCallbackUrl(
  origin: string | null,
  fallbackUrl: string,
  profileIncomplete: boolean,
  outcome?: OAuthOutcome,
): string {
  if (outcome === 'signup-disabled') {
    const url = origin ? new URL('/', origin) : new URL(fallbackUrl)
    url.searchParams.set('signup', '1')
    url.searchParams.set('profileIncomplete', String(profileIncomplete))
    return url.toString()
  }

  const url = origin ? new URL('/oauth/callback', origin) : new URL(fallbackUrl)
  url.searchParams.set('profileIncomplete', String(profileIncomplete))
  if (outcome) {
    url.searchParams.set('oauthOutcome', outcome)
  }
  return url.toString()
}
