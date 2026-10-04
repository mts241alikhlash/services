export interface SsoAuthorizationCodeEntity {
  id: string
  codeHash: string
  parentSessionId: string
  appKey: string
  redirectUri: string
  codeChallenge: string
  expiresAt: Date
  usedAt: Date | null
  childSessionId: string | null
  createdAt: Date
}
