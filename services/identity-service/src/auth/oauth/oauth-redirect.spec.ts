import {
  buildCallbackUrl,
  decodeOAuthState,
  encodeOAuthState,
  normalizeOrigin,
  parseRedirectAllowlist,
  resolveRedirectOrigin,
} from './oauth-redirect.js'

const FALLBACK = 'http://localhost:5173/oauth/callback'
const ALLOWLIST = ['http://localhost:5173', 'http://localhost:5175']

describe('oauth redirect helpers', () => {
  describe('parseRedirectAllowlist', () => {
    it('trims and drops empty entries', () => {
      expect(
        parseRedirectAllowlist(' http://a.test , ,http://b.test '),
      ).toEqual(['http://a.test', 'http://b.test'])
    })
  })

  describe('normalizeOrigin', () => {
    it('reduces a URL to its origin', () => {
      expect(normalizeOrigin('http://localhost:5175/oauth/callback')).toBe(
        'http://localhost:5175',
      )
    })

    it('returns null for a non-URL', () => {
      expect(normalizeOrigin('not-a-url')).toBeNull()
    })
  })

  describe('resolveRedirectOrigin', () => {
    it('accepts an allow-listed origin', () => {
      expect(resolveRedirectOrigin('http://localhost:5175', ALLOWLIST)).toBe(
        'http://localhost:5175',
      )
    })

    it('accepts an allow-listed origin given as a full URL', () => {
      expect(
        resolveRedirectOrigin(
          'http://localhost:5175/oauth/callback',
          ALLOWLIST,
        ),
      ).toBe('http://localhost:5175')
    })

    it('rejects an origin outside the allowlist', () => {
      expect(resolveRedirectOrigin('https://evil.test', ALLOWLIST)).toBeNull()
    })

    it('rejects a lookalike subdomain', () => {
      expect(
        resolveRedirectOrigin('http://localhost:5175.evil.test', ALLOWLIST),
      ).toBeNull()
    })

    it('rejects a missing redirect', () => {
      expect(resolveRedirectOrigin(undefined, ALLOWLIST)).toBeNull()
    })
  })

  describe('encodeOAuthState', () => {
    it('round-trips a signin intent', () => {
      expect(
        decodeOAuthState(encodeOAuthState('http://localhost:5175', 'signin')),
      ).toEqual({
        origin: 'http://localhost:5175',
        intent: 'signin',
      })
    })

    it('round-trips a signup intent', () => {
      expect(
        decodeOAuthState(encodeOAuthState('http://localhost:5175', 'signup')),
      ).toEqual({
        origin: 'http://localhost:5175',
        intent: 'signup',
      })
    })

    it('produces a URL-safe value', () => {
      const encoded = encodeOAuthState('http://localhost:5175', 'signup')
      expect(encoded).not.toMatch(/[+/=]/)
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
    })
  })

  describe('decodeOAuthState', () => {
    it('decodes a bare origin as a signin intent', () => {
      expect(decodeOAuthState('http://localhost:5175')).toEqual({
        origin: 'http://localhost:5175',
        intent: 'signin',
      })
    })

    it('decodes an empty state as no origin and signin', () => {
      expect(decodeOAuthState(undefined)).toEqual({
        origin: null,
        intent: 'signin',
      })
      expect(decodeOAuthState('')).toEqual({ origin: null, intent: 'signin' })
    })

    it('decodes garbage as a bare origin with signin and does not throw', () => {
      expect(decodeOAuthState('not-base64!!')).toEqual({
        origin: 'not-base64!!',
        intent: 'signin',
      })
    })

    it('decodes an unknown intent as signin', () => {
      const encoded = Buffer.from(
        JSON.stringify({ origin: 'http://localhost:5175', intent: 'admin' }),
      ).toString('base64url')

      expect(decodeOAuthState(encoded)).toEqual({
        origin: 'http://localhost:5175',
        intent: 'signin',
      })
    })

    it('decodes valid JSON without an origin as a bare origin', () => {
      const encoded = Buffer.from(
        JSON.stringify({ intent: 'signup' }),
      ).toString('base64url')

      expect(decodeOAuthState(encoded)).toEqual({
        origin: encoded,
        intent: 'signin',
      })
    })
  })

  describe('buildCallbackUrl', () => {
    it('targets the origin when one is resolved', () => {
      expect(buildCallbackUrl('http://localhost:5175', FALLBACK, false)).toBe(
        'http://localhost:5175/oauth/callback?profileIncomplete=false',
      )
    })

    it('falls back to the configured URL when no origin is resolved', () => {
      expect(buildCallbackUrl(null, FALLBACK, true)).toBe(
        'http://localhost:5173/oauth/callback?profileIncomplete=true',
      )
    })

    it('appends the outcome when one is given', () => {
      expect(
        buildCallbackUrl(
          'http://localhost:5175',
          FALLBACK,
          false,
          'signup-created',
        ),
      ).toBe(
        'http://localhost:5175/oauth/callback?profileIncomplete=false&oauthOutcome=signup-created',
      )
    })

    it('targets the origin root with signup=1 for signup-disabled', () => {
      expect(
        buildCallbackUrl(
          'http://localhost:5175',
          FALLBACK,
          true,
          'signup-disabled',
        ),
      ).toBe('http://localhost:5175/?signup=1&profileIncomplete=true')
    })

    it('does not set oauthOutcome for signup-disabled', () => {
      const url = buildCallbackUrl(
        'http://localhost:5175',
        FALLBACK,
        false,
        'signup-disabled',
      )
      expect(url).not.toContain('oauthOutcome')
    })

    it('falls back to the configured URL for signup-disabled with no origin', () => {
      expect(buildCallbackUrl(null, FALLBACK, false, 'signup-disabled')).toBe(
        'http://localhost:5173/oauth/callback?signup=1&profileIncomplete=false',
      )
    })
  })
})
