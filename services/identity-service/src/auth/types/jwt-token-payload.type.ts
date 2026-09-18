export interface JwtTokenPayload {
  sub: string
  sessionId: string
  identifier: string
  type: 'access' | 'refresh'

  roles?: string[]

  permissions?: string[]
}

export const TOKEN_PERMISSION_BUDGET_BYTES = 3000
