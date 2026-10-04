import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { AppConfigModule } from './core/config/config.module.js'
import { PrismaModule } from './core/database/prisma.module.js'
import { HttpExceptionFilter } from './core/filters/http-exception.filter.js'
import { HealthModule } from './core/health/health.module.js'
import { ResponseInterceptor } from './core/interceptors/response.interceptor.js'
import { pinoLoggerConfig } from './core/logger/logger.config.js'
import { PresenceModule } from './presence/presence.module.js'
import { AuthModule } from './platform/auth/auth.module.js'
import { IdentityModule } from './platform/identity/identity.module.js'
import { ProfileLookupModule } from './platform/profile-lookup/profile-lookup.module.js'
import { PermissionModule } from './platform/access-control/permission/permission.module.js'
import { JwtAuthGuard } from './platform/auth/index.js'
import { PermissionGuard } from './platform/access-control/permission/guards/permission.guard.js'

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    LoggerModule.forRoot(pinoLoggerConfig),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'default',
          ttl: configService.get<number>('THROTTLE_TTL', 60000),
          limit: configService.get<number>('THROTTLE_LIMIT', 500),
        },
      ],
    }),
    HealthModule,
    IdentityModule,
    ProfileLookupModule,
    AuthModule,
    PermissionModule,
    PresenceModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
