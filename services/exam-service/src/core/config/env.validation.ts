import { z } from 'zod'

const DURATION_PATTERN = /^\d+[smhd]$/

export const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: z.string().optional(),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4100),
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
    IDENTITY_SERVICE_URL: z
      .string()
      .url('IDENTITY_SERVICE_URL must be a valid URL'),
    ACADEMIC_SERVICE_URL: z
      .string()
      .url('ACADEMIC_SERVICE_URL must be a valid URL'),
    HR_SERVICE_URL: z.string().url('HR_SERVICE_URL must be a valid URL'),
    STUDENT_SERVICE_URL: z
      .string()
      .url('STUDENT_SERVICE_URL must be a valid URL'),
    ASSESSMENT_SERVICE_URL: z
      .string()
      .url('ASSESSMENT_SERVICE_URL must be a valid URL'),
    PROVISIONING_SERVICE_TOKEN: z
      .string()
      .min(16, 'PROVISIONING_SERVICE_TOKEN must be at least 16 characters'),
    EXAM_ACCESS_CODE_SECRET: z
      .string()
      .min(32, 'EXAM_ACCESS_CODE_SECRET must be at least 32 characters'),
    // Exam camera streaming. Both default to an unroutable host so a deployment
    // that never sets them fails visibly instead of pointing at production.
    STREAM_WHIP_URL: z
      .string()
      .url('STREAM_WHIP_URL must be a valid URL')
      .default('https://stream.invalid'),
    STREAM_HLS_URL: z
      .string()
      .url('STREAM_HLS_URL must be a valid URL')
      .default('https://stream.invalid'),
    IDENTITY_CACHE_TTL_MS: z.coerce.number().int().min(0).default(5000),
    IDENTITY_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1)
      .max(30000)
      .default(3000),
    IDENTITY_CACHE_MAX_ENTRIES: z.coerce
      .number()
      .int()
      .min(1)
      .max(100000)
      .default(1000),
    IDENTITY_MAX_CONCURRENT_REQUESTS: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .default(100),
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

    S3_ENDPOINT: z.string().url('S3_ENDPOINT must be a valid URL'),
    S3_PUBLIC_ENDPOINT: z
      .string()
      .url('S3_PUBLIC_ENDPOINT must be a valid URL')
      .optional(),
    S3_REGION: z.string().min(1).default('us-east-1'),
    S3_BUCKET: z.string().min(1, 'S3_BUCKET is required'),
    S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required'),
    S3_SECRET_ACCESS_KEY: z.string().min(1, 'S3_SECRET_ACCESS_KEY is required'),
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
        env.EXAM_ACCESS_CODE_SECRET,
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['EXAM_ACCESS_CODE_SECRET'],
        message:
          'EXAM_ACCESS_CODE_SECRET looks like a placeholder; use a strong random value',
      })
    }
  })

export type EnvConfig = z.infer<typeof envSchema>
