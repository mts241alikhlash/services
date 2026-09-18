import { z } from 'zod'

const DURATION_PATTERN = /^\d+[smhd]$/

export const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: z.string().optional(),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),

    THROTTLE_TTL: z.coerce
      .number()
      .int()
      .min(1000)
      .max(3_600_000)
      .default(60000),
    THROTTLE_LIMIT: z.coerce.number().int().min(1).max(10000).default(100),
    AUTH_THROTTLE_TTL: z.coerce
      .number()
      .int()
      .min(1000)
      .max(3_600_000)
      .default(60000),
    AUTH_THROTTLE_LIMIT: z.coerce.number().int().min(1).max(10000).default(10),

    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_ACCESS_EXPIRATION: z
      .string()
      .regex(
        DURATION_PATTERN,
        'JWT_ACCESS_EXPIRATION must match <number><s|m|h|d>',
      )
      .default('15m'),
    JWT_REFRESH_EXPIRATION: z
      .string()
      .regex(
        DURATION_PATTERN,
        'JWT_REFRESH_EXPIRATION must match <number><s|m|h|d>',
      )
      .default('7d'),

    PROVISIONING_SERVICE_TOKEN: z
      .string()
      .min(16, 'PROVISIONING_SERVICE_TOKEN must be at least 16 characters'),

    GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
    GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
    GOOGLE_CALLBACK_URL: z
      .string()
      .url('GOOGLE_CALLBACK_URL must be a valid URL'),
    GOOGLE_OAUTH_SUCCESS_REDIRECT_URL: z
      .string()
      .url('GOOGLE_OAUTH_SUCCESS_REDIRECT_URL must be a valid URL'),
    GOOGLE_OAUTH_REDIRECT_ALLOWLIST: z
      .string()
      .refine(
        (val) => {
          const origins = val
            .split(',')
            .map((o) => o.trim())
            .filter((o) => o.length > 0)
          if (origins.length === 0) return false
          return origins.every((origin) => {
            try {
              return new URL(origin).origin === origin
            } catch {
              return false
            }
          })
        },
        {
          message:
            'GOOGLE_OAUTH_REDIRECT_ALLOWLIST must be a comma-separated list of origins (no path or trailing slash)',
        },
      )
      .default(
        'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://localhost:5178,http://localhost:5179',
      ),

    GOOGLE_SIGNUP_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),

    FRONTEND_URL: z
      .string()
      .refine(
        (val) => {
          const urls = val
            .split(',')
            .map((u) => u.trim())
            .filter((u) => u.length > 0)
          if (urls.length === 0) return false
          return urls.every((url) => {
            try {
              new URL(url)
              return true
            } catch {
              return false
            }
          })
        },
        {
          message:
            'FRONTEND_URL must be a valid URL or a comma-separated list of valid URLs',
        },
      )
      .default('http://localhost:5173'),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),

    S3_ENDPOINT: z.string().url('S3_ENDPOINT must be a valid URL').optional(),
    S3_PUBLIC_ENDPOINT: z
      .string()
      .url('S3_PUBLIC_ENDPOINT must be a valid URL')
      .optional(),
    S3_REGION: z.string().min(1).default('us-east-1'),
    S3_BUCKET: z.string().min(1).optional(),
    S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    S3_SIGNED_URL_EXPIRY_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(604800)
      .default(3600),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') {
      return
    }

    if (env.FRONTEND_URL.includes('*')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FRONTEND_URL'],
        message: 'FRONTEND_URL cannot use wildcard in production',
      })
    }

    if (env.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be at least 32 characters in production',
      })
    }

    if (/change[-_ ]?me|your[-_ ]?super[-_ ]?secret/i.test(env.JWT_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message:
          'JWT_SECRET looks like a placeholder; use a strong random value',
      })
    }

    if (env.PROVISIONING_SERVICE_TOKEN.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PROVISIONING_SERVICE_TOKEN'],
        message:
          'PROVISIONING_SERVICE_TOKEN must be at least 32 characters in production',
      })
    }

    if (
      /change[-_ ]?me|your[-_ ]?super[-_ ]?secret/i.test(
        env.PROVISIONING_SERVICE_TOKEN,
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PROVISIONING_SERVICE_TOKEN'],
        message:
          'PROVISIONING_SERVICE_TOKEN looks like a placeholder; use a strong random value',
      })
    }

    if (
      /change[-_ ]?me|your[-_ ]?super[-_ ]?secret/i.test(
        env.GOOGLE_CLIENT_SECRET,
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GOOGLE_CLIENT_SECRET'],
        message:
          'GOOGLE_CLIENT_SECRET looks like a placeholder; use the real value from Google Cloud Console',
      })
    }
  })

export type EnvConfig = z.infer<typeof envSchema>
