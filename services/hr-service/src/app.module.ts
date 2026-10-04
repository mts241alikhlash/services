import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { AppConfigModule } from './core/config/config.module.js'
import { PrismaModule } from './core/database/prisma.module.js'
import { AppCacheModule } from './core/cache/cache.module.js'
import { HttpExceptionFilter } from './core/filters/http-exception.filter.js'
import { HealthModule } from './core/health/health.module.js'
import { ResponseInterceptor } from './core/interceptors/response.interceptor.js'
import { pinoLoggerConfig } from './core/logger/logger.config.js'
import { AuthModule } from './platform/auth/auth.module.js'
import { IdentityModule } from './platform/identity/identity.module.js'
import { ServiceClientModule } from './platform/service-client/service-client.module.js'
import { AcademicLookupModule } from './platform/academic-lookup/academic-lookup.module.js'
import { ProfileLookupModule } from './platform/profile-lookup/profile-lookup.module.js'
import { PermissionModule } from './platform/access-control/permission/permission.module.js'
import { UserModule } from './platform/user/user.module.js'
import { JwtAuthGuard } from './platform/auth/index.js'
import { PermissionGuard } from './platform/access-control/permission/guards/permission.guard.js'
import { EmployeeModule } from './employee/employee.module.js'
import { PayrollModule } from './payroll/payroll.module.js'
import { AuditLogModule } from './platform/audit-log/audit-log.module.js'
import { PresenceLookupModule } from './platform/presence-lookup/presence-lookup.module.js'
import { EmploymentTypeModule } from './reference-data/employment-type/employment-type.module.js'
import { PositionModule } from './reference-data/position/position.module.js'
import { PositionCategoryModule } from './reference-data/position-category/position-category.module.js'

@Module({
  imports: [
    AppConfigModule,
    ServiceClientModule,
    AcademicLookupModule,
    PrismaModule,
    LoggerModule.forRoot(pinoLoggerConfig),
    ScheduleModule.forRoot(),
    AppCacheModule,
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
    UserModule,
    EmploymentTypeModule,
    PositionCategoryModule,
    PositionModule,
    EmployeeModule,
    AuditLogModule,
    PresenceLookupModule,
    PayrollModule,
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
