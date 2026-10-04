import { envSchema } from './env.validation.js'

const base = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/inventory',
  JWT_SECRET: 'a-local-jwt-secret-long-enough',
  IDENTITY_SERVICE_URL: 'http://identity-service:3000',
}

describe('inventory env', () => {
  it('requires the provisioning token identity asks for on introspection', () => {
    expect(envSchema.safeParse(base).success).toBe(false)
  })

  it('accepts a provisioning token of at least 16 characters', () => {
    expect(
      envSchema.safeParse({
        ...base,
        PROVISIONING_SERVICE_TOKEN: 'a-provisioning-token',
      }).success,
    ).toBe(true)
  })
})
