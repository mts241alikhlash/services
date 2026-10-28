import { envSchema } from './env.validation.js'

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  NODE_ENV: 'production',
  JWT_SECRET: 'a-strong-random-jwt-secret-of-32-chars-or-more-0123',
  FRONTEND_URL: 'https://app.example.sch.id',
  IDENTITY_SERVICE_URL: 'http://identity-service:3000',
  ACADEMIC_SERVICE_URL: 'http://academic-service:3200',
  HR_SERVICE_URL: 'http://hr-service:3800',
  STUDENT_SERVICE_URL: 'http://student-service:3900',
  PROVISIONING_SERVICE_TOKEN: 'a-strong-provisioning-token-0123456789',
  EXAM_ACCESS_CODE_SECRET: 'k3J9xQ2mV8pL5nR7tY1wZ4cB6dF0gHaS',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_BUCKET: 'bucket',
  S3_ACCESS_KEY_ID: 'key',
  S3_SECRET_ACCESS_KEY: 'secret',
}

const PLACEHOLDER = 'change-me-a-64-char-random-string-never-shared'

describe('envSchema EXAM_ACCESS_CODE_SECRET', () => {
  it('accepts a strong secret in production', () => {
    expect(envSchema.safeParse(base).success).toBe(true)
  })

  it('rejects a secret shorter than 32 characters', () => {
    const result = envSchema.safeParse({
      ...base,
      EXAM_ACCESS_CODE_SECRET: 'short',
    })

    expect(result.success).toBe(false)
  })

  it('rejects the placeholder from .env.example in production', () => {
    const result = envSchema.safeParse({
      ...base,
      EXAM_ACCESS_CODE_SECRET: PLACEHOLDER,
    })

    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain(
      'EXAM_ACCESS_CODE_SECRET looks like a placeholder',
    )
  })

  it('lets the placeholder through outside production', () => {
    const result = envSchema.safeParse({
      ...base,
      NODE_ENV: 'development',
      EXAM_ACCESS_CODE_SECRET: PLACEHOLDER,
    })

    expect(result.success).toBe(true)
  })
})
