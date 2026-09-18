import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { Request, Response } from 'express'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(HttpExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const { statusCode, message } = this.resolveException(exception)
    const path = (request.originalUrl || request.url).split('?', 1)[0]
    const errorText = Array.isArray(message) ? message.join('; ') : message

    const responseTime = request._startTime
      ? Date.now() - request._startTime
      : undefined
    const summary = `${request.method} ${path} - ${String(statusCode)} - ${errorText}`
    const userId = request.user?.id

    if (statusCode >= 500) {
      this.logger.error({ statusCode, responseTime, userId }, summary)

      response.status(statusCode).json({
        statusCode,
        message: 'Internal server error',
        error: 'Internal Server Error',
        data: null,
      })
      return
    } else if (path !== '/favicon.ico') {
      this.logger.warn({ statusCode, responseTime, userId }, summary)
    }

    response.status(statusCode).json({ statusCode, message, data: null })
  }

  private resolveException(exception: unknown): {
    statusCode: number
    message: string | string[]
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus()

      if (statusCode >= 500) {
        return { statusCode, message: 'Internal server error' }
      }

      return { statusCode, message: this.extractClientMessage(exception) }
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        const fields = Array.isArray(exception.meta?.target)
          ? (exception.meta.target as string[]).join(', ')
          : 'field'
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with the same ${fields} already exists`,
        }
      }

      if (exception.code === 'P2025') {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
        }
      }

      if (exception.code === 'P2003') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Operation failed: a referenced record does not exist.',
        }
      }

      if (exception.code === 'P2000' || exception.code === 'P2011') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid data: a required field is missing or too long.',
        }
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    }
  }

  private extractClientMessage(exception: HttpException): string | string[] {
    const body = exception.getResponse()

    if (typeof body === 'string') return body

    if (typeof body === 'object' && body !== null) {
      const res = body as { message?: string | string[] }
      return res.message ?? exception.message
    }

    return exception.message
  }
}
