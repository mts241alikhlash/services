import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { AppConfigModule } from './core/config/config.module.js'
import { StorageModule } from './core/storage/storage.module.js'
import { PrismaModule } from './core/database/prisma.module.js'
import { HttpExceptionFilter } from './core/filters/http-exception.filter.js'
import { HealthModule } from './core/health/health.module.js'
import { ResponseInterceptor } from './core/interceptors/response.interceptor.js'
import { pinoLoggerConfig } from './core/logger/logger.config.js'
import { AuthModule } from './auth/auth.module.js'
import { JwtAuthGuard } from './auth/index.js'
import { UserModule } from './user/user.module.js'
import { ProfileModule } from './profile/profile.module.js'
import { RegionModule } from './reference-data/region/region.module.js'
import { RoleModule } from './access-control/role/role.module.js'
import { PermissionModule } from './access-control/permission/permission.module.js'
import { PermissionGuard } from './access-control/permission/guards/permission.guard.js'
import { SessionModule } from './session/session.module.js'
import { AuditLogModule } from './audit-log/audit-log.module.js'
import { SchoolUnitModule } from './school-unit/school-unit.module.js'
import { SchoolUnitTypeModule } from './reference-data/school-unit-type/school-unit-type.module.js'
import { ReligionModule } from './reference-data/religion/religion.module.js'
import { BloodTypeModule } from './reference-data/blood-type/blood-type.module.js'

@Module({
  imports: [
    AppConfigModule,
    StorageModule,
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
        {
          name: 'auth',
          ttl: configService.get<number>('AUTH_THROTTLE_TTL', 60000),
          limit: configService.get<number>('AUTH_THROTTLE_LIMIT', 20),
        },
      ],
    }),
    HealthModule,
    AuthModule,
    UserModule,
    ProfileModule,
    RegionModule,
    RoleModule,
    PermissionModule,
    SessionModule,
    AuditLogModule,
    SchoolUnitModule,
    SchoolUnitTypeModule,
    ReligionModule,
    BloodTypeModule,
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
