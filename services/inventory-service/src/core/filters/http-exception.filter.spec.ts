import {
  ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PinoLogger } from 'nestjs-pino'
import { HttpExceptionFilter } from './http-exception.filter.js'

type ExtendedHost = ArgumentsHost & {
  _mockStatus: jest.Mock
  _mockJson: jest.Mock
}

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter

  const createMockHost = (
    overrides: Record<string, unknown> = {},
  ): ArgumentsHost => {
    const mockJson = jest.fn()
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson })

    const mockRequest = {
      method: 'GET',
      originalUrl: '/api/test',
      url: '/api/test',
      _startTime: Date.now() - 50,
      ...overrides,
    }

    return {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => mockRequest,
      }),
      _mockStatus: mockStatus,
      _mockJson: mockJson,
    } as unknown as ExtendedHost
  }

  beforeEach(() => {
    filter = new HttpExceptionFilter(mockLogger as unknown as PinoLogger)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(filter).toBeDefined()
  })

  describe('HttpException handling', () => {
    it('should handle 400 BadRequestException', () => {
      const exception = new BadRequestException('Validation failed')
      const host = createMockHost()

      filter.catch(exception, host)

      const mockStatus = (host as ExtendedHost)._mockStatus
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockLogger.warn).toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should handle 404 NotFoundException', () => {
      const exception = new NotFoundException('Resource not found')
      const host = createMockHost()

      filter.catch(exception, host)

      const mockStatus = (host as ExtendedHost)._mockStatus
      expect(mockStatus).toHaveBeenCalledWith(404)
      expect(mockLogger.warn).toHaveBeenCalled()
    })

    it('should handle 500 InternalServerErrorException with error log', () => {
      const exception = new InternalServerErrorException('Server error')
      const host = createMockHost()

      filter.catch(exception, host)

      const mockStatus = (host as ExtendedHost)._mockStatus
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockLogger.error).toHaveBeenCalled()
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })

    it('keeps sensitive request and exception data out of error logs', () => {
      const exception = new InternalServerErrorException(
        'SQL credentials and raw exception details',
      )
      const host = createMockHost({
        originalUrl: '/api/approval?token=secret',
        user: { id: 'user-1' },
      })

      filter.catch(exception, host)

      const [payload, summary] = mockLogger.error.mock.calls[0] as [
        Record<string, unknown>,
        string,
      ]
      expect(payload).toEqual(
        expect.objectContaining({
          statusCode: 500,
          responseTime: expect.any(Number),
          userId: 'user-1',
        }),
      )
      expect(payload).not.toHaveProperty('stack')
      expect(payload).not.toHaveProperty('details')
      expect(JSON.stringify(payload)).not.toContain('token')
      expect(JSON.stringify(payload)).not.toContain('credentials')
      expect(JSON.stringify(payload)).not.toContain('SQL')
      expect(JSON.stringify(payload)).not.toContain('raw exception details')
      expect(summary).toBe('GET /api/approval - 500 - Internal server error')
      expect(summary).not.toContain('token')
      expect(summary).not.toContain('secret')
      expect(summary).not.toContain('credentials')
      expect(summary).not.toContain('SQL')
      expect(summary).not.toContain('raw exception details')
    })

    it('should mask 5xx error messages as "Internal server error" in production', () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      try {
        const prodFilter = new HttpExceptionFilter(
          mockLogger as unknown as PinoLogger,
        )
        const exception = new InternalServerErrorException('Secret DB error')
        const host = createMockHost()

        prodFilter.catch(exception, host)

        const mockJson = (host as ExtendedHost)._mockJson
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 500,
            message: 'Internal server error',
          }),
        )
      } finally {
        process.env.NODE_ENV = prev
      }
    })

    it('should not expose 5xx details outside production', () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      try {
        const devFilter = new HttpExceptionFilter(
          mockLogger as unknown as PinoLogger,
        )
        const exception = new Error('Secret DB error with SQL credentials')
        const host = createMockHost({ originalUrl: '/api/secret?token=secret' })

        devFilter.catch(exception, host)

        const mockJson = (host as ExtendedHost)._mockJson
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 500,
            message: 'Internal server error',
            error: 'Internal Server Error',
            data: null,
          }),
        )
        const response = mockJson.mock.calls[0]?.[0] as Record<string, unknown>
        expect(JSON.stringify(response)).not.toContain('Secret DB error')
        expect(JSON.stringify(response)).not.toContain('credentials')
        expect(JSON.stringify(response)).not.toContain('secret')
        expect(response).not.toHaveProperty('stack')
      } finally {
        process.env.NODE_ENV = prev
      }
    })

    it('should handle validation errors with message array', () => {
      const exception = new BadRequestException({
        message: ['field1 is required', 'field2 must be a string'],
      })
      const host = createMockHost()

      filter.catch(exception, host)

      const mockJson = (host as ExtendedHost)._mockJson
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: ['field1 is required', 'field2 must be a string'],
        }),
      )
    })

    it('should not expose Prisma not-found details', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Raw SQL connection details',
        {
          code: 'P2025',
          clientVersion: '7.10.0',
          meta: { cause: 'SQL URL credentials and stack' },
        },
      )
      const host = createMockHost()

      filter.catch(exception, host)

      const mockJson = (host as ExtendedHost)._mockJson
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 404,
        message: 'Record not found',
        data: null,
      })
    })
  })

  describe('unknown exception handling', () => {
    it('should handle unknown errors as 500', () => {
      const exception = new Error('Something unexpected')
      const host = createMockHost()

      filter.catch(exception, host)

      const mockStatus = (host as ExtendedHost)._mockStatus
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle non-Error thrown values', () => {
      const host = createMockHost()

      filter.catch('string error', host)

      const mockStatus = (host as ExtendedHost)._mockStatus
      expect(mockStatus).toHaveBeenCalledWith(500)
    })

    it('does not return raw details from a 500 HttpException', () => {
      const exception = new InternalServerErrorException(
        'SQL credentials and connection URL',
      )
      const host = createMockHost({ originalUrl: '/api/secret?token=secret' })

      filter.catch(exception, host)

      const mockJson = (host as ExtendedHost)._mockJson
      const response = mockJson.mock.calls[0]?.[0] as Record<string, unknown>
      expect(response).toEqual({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
        data: null,
      })
      expect(JSON.stringify(response)).not.toContain('credentials')
      expect(JSON.stringify(response)).not.toContain('secret')
      expect(JSON.stringify(response)).not.toContain('URL')
      expect(response).not.toHaveProperty('stack')
    })
  })

  describe('favicon.ico suppression', () => {
    it('should not log for /favicon.ico requests', () => {
      const exception = new NotFoundException()
      const host = createMockHost({ originalUrl: '/favicon.ico' })

      filter.catch(exception, host)

      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('response format', () => {
    it('should always include statusCode, message, and data: null', () => {
      const exception = new BadRequestException('Bad input')
      const host = createMockHost()

      filter.catch(exception, host)

      const mockJson = (host as ExtendedHost)._mockJson
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          data: null,
        }),
      )
    })
  })
})
