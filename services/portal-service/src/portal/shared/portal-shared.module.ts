import { Global, Module } from '@nestjs/common'
import { PortalCacheInterceptor } from './interceptors/portal-cache.interceptor.js'
import { PortalCacheService } from './services/portal-cache.service.js'

@Global()
@Module({
  providers: [PortalCacheService, PortalCacheInterceptor],
  exports: [PortalCacheService, PortalCacheInterceptor],
})
export class PortalSharedModule {}
