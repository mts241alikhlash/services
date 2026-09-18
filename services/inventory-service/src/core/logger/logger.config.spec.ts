import { pinoLoggerConfig } from './logger.config.js'

describe('pinoLoggerConfig', () => {
  it('keeps request logs to safe path and request fields', () => {
    const serializers = (
      pinoLoggerConfig.pinoHttp as unknown as {
        serializers: {
          req: (request: Record<string, unknown>) => Record<string, unknown>
          res: (response: Record<string, unknown>) => Record<string, unknown>
          err: (error: Record<string, unknown>) => Record<string, unknown>
        }
        customProps: (
          request: Record<string, unknown>,
        ) => Record<string, unknown>
      }
    ).serializers

    const request = serializers.req({
      id: 'request-1',
      method: 'GET',
      url: '/api/approvals?token=raw-token',
      query: { token: 'raw-token' },
      raw: {
        originalUrl: '/api/approvals?token=raw-token',
        params: { id: 'approval-1', token: 'raw-token' },
      },
    })

    expect(request).toEqual({
      id: 'request-1',
      method: 'GET',
      url: '/api/approvals',
    })
    expect(JSON.stringify(request)).not.toContain('raw-token')
    expect(serializers.res({ statusCode: 201 })).toEqual({ statusCode: 201 })
    expect(
      (
        pinoLoggerConfig.pinoHttp as unknown as {
          customProps: (
            request: Record<string, unknown>,
          ) => Record<string, unknown>
        }
      ).customProps({ user: { id: 'user-1' } }),
    ).toEqual({ userId: 'user-1' })
    expect(
      serializers.err({
        message: 'SQL credentials',
        stack: 'raw stack',
      }),
    ).toEqual({})
  })
})
