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
import { IdentityModule } from './platform/identity/identity.module.js'
import { ServiceClientModule } from './platform/service-client/service-client.module.js'
import { AuthModule } from './platform/auth/auth.module.js'
import { AuthorLookupModule } from './platform/author-lookup/author-lookup.module.js'
import { AcademicLookupModule } from './platform/academic-lookup/academic-lookup.module.js'
import { ExamFileModule } from './exam-file/exam-file.module.js'
import { ExamPackageModule } from './exam-package/exam-package.module.js'
import { ExamScheduleModule } from './exam-schedule/exam-schedule.module.js'
import { QuestionImportModule } from './question-import/question-import.module.js'
import { QuestionModule } from './question/question.module.js'
import { StorageModule } from './core/storage/storage.module.js'
import { PermissionModule } from './platform/access-control/permission/permission.module.js'
import { EmployeeIdentityModule } from './platform/employee-identity/employee-identity.module.js'
import { JwtAuthGuard } from './platform/auth/index.js'
import { PermissionGuard } from './platform/access-control/permission/guards/permission.guard.js'

@Module({
  imports: [
    AppConfigModule,
    ServiceClientModule,
    PrismaModule,
    StorageModule,
    AcademicLookupModule,
    AuthorLookupModule,
    QuestionModule,
    ExamPackageModule,
    ExamScheduleModule,
    ExamFileModule,
    QuestionImportModule,
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
    AuthModule,
    PermissionModule,
    EmployeeIdentityModule,
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
