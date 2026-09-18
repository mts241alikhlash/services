import type { IncomingMessage } from 'http'
import type { Params } from 'nestjs-pino'

export const pinoLoggerConfig: Params = {
  pinoHttp: {
    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',

    genReqId: (req) =>
      (req.headers['x-request-id'] as string | undefined) ??
      crypto.randomUUID(),

    customLogLevel: (_req, res) => {
      if (res.statusCode >= 400) return 'silent'
      return 'info'
    },

    customProps: (req: IncomingMessage) => {
      const props: Record<string, unknown> = {}
      const { user } = req as IncomingMessage & { user?: { id: string } }
      if (user) {
        props.userId = user.id
      }
      return props
    },

    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,

    serializers: {
      req: (raw: Record<string, unknown>) => {
        const req = raw as {
          id: unknown
          method: string
          url: string
          raw?: { originalUrl?: string; params?: Record<string, string> }
        }

        const serialized: Record<string, unknown> = {
          id: req.id,
          method: req.method,
          url: (req.raw?.originalUrl ?? req.url).split('?', 1)[0],
        }

        return serialized
      },
      res: (raw: Record<string, unknown>) => ({
        statusCode: (raw as { statusCode: number }).statusCode,
      }),
      err: () => ({}),
    },

    ...(process.env.NODE_ENV === 'production' && {
      formatters: {
        level: (label: string) => ({ level: label }),
      },
      base: { application: 'mts241alikhlash-api' },
    }),

    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  },

  renameContext: 'context',
}
