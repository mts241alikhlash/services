import { applyDecorators, UseInterceptors } from '@nestjs/common'
import { SkipThrottle, Throttle } from '@nestjs/throttler'
import { Public } from '../../../core/decorators/public.decorator.js'
import { PortalCacheInterceptor } from '../interceptors/portal-cache.interceptor.js'

export function PortalPublic() {
  return applyDecorators(
    PortalPublicUncached(),
    UseInterceptors(PortalCacheInterceptor),
  )
}

export function PortalPublicUncached() {
  return applyDecorators(
    Public(),
    SkipThrottle({ default: true, auth: true }),
    Throttle({ 'portal-public': {} }),
  )
}
