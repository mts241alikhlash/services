export interface JwtTokenPayload {
  sub: string
  sessionId: string
  identifier: string
  type: 'access' | 'refresh'

  roles?: string[]

  permissions?: string[]
}
