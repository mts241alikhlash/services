import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import type { Request } from 'express'
import { Observable, of, tap } from 'rxjs'
import { PortalCacheService } from '../services/portal-cache.service.js'

const PORTAL_CACHE_TTL_MS = 60_000

@Injectable()
export class PortalCacheInterceptor implements NestInterceptor {
  constructor(private readonly cache: PortalCacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>()
    if (request.method !== 'GET') return next.handle()

    const key = request.originalUrl
    const cached = await this.cache.get<unknown>(key)
    if (cached !== undefined) return of(cached)

    return next.handle().pipe(
      tap((value) => {
        void this.cache.set(key, value, PORTAL_CACHE_TTL_MS)
      }),
    )
  }
}
