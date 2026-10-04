import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface ResponseEnvelope<T> {
  statusCode: number
  message: string
  data: T
  meta?: Record<string, unknown>
}

interface PaginatedPayload<T> {
  data: T[]
  total: number
  page: number
  limit: number
  summary?: unknown
}

function isPaginatedPayload(body: unknown): body is PaginatedPayload<unknown> {
  return (
    body !== null &&
    typeof body === 'object' &&
    'data' in body &&
    'total' in body &&
    'page' in body &&
    'limit' in body &&
    Array.isArray((body as Record<string, unknown>).data)
  )
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ResponseEnvelope<T> | StreamableFile
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T> | StreamableFile> {
    const ctx = context.switchToHttp()
    const response = ctx.getResponse<import('express').Response>()

    return next.handle().pipe(
      map((body: unknown) => {
        if (body instanceof StreamableFile) {
          return body
        }

        const statusCode = response.statusCode

        if (isPaginatedPayload(body)) {
          const { data, total, page, limit, summary } = body
          return {
            statusCode,
            message: 'Success',
            data: data as T,
            meta: {
              total,
              page,
              limit,
              ...(summary !== undefined && { summary }),
            },
          }
        }

        if (body && typeof body === 'object' && 'data' in body) {
          const resBody = body as {
            message?: string
            data: T
            meta?: Record<string, unknown>
          }
          return {
            statusCode,
            message: resBody.message ?? 'Success',
            data: resBody.data,
            ...(resBody.meta !== undefined && { meta: resBody.meta }),
          }
        }

        return {
          statusCode,
          message: 'Success',
          data: body as T,
        }
      }),
    )
  }
}
