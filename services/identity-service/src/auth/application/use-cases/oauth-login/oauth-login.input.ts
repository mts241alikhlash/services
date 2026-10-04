import type { OAuthIntent } from '../../../oauth/oauth-redirect.js'

export interface OAuthLoginInput {
  provider: string
  providerUserId: string
  email: string
  emailVerified: boolean
  intent: OAuthIntent
}
