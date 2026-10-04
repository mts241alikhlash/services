export interface OAuthAccountEntity {
  id: string
  userId: string
  provider: string
  providerUserId: string
  email: string
  createdAt: Date
}
