export interface Identity {
  userId: string
  identifier: string
  sessionId: string
  roles: string[]
  permissions: string[]
}

export abstract class IIdentityPort {
  abstract resolve(accessToken: string): Promise<Identity | null>
}
