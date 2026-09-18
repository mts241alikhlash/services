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
import { PermissionModule } from './platform/access-control/permission/permission.module.js'
import { EmployeeIdentityModule } from './platform/employee-identity/employee-identity.module.js'
import { ParentLookupModule } from './platform/parent-lookup/parent-lookup.module.js'
import { EmployeeLookupModule } from './platform/employee-lookup/employee-lookup.module.js'
import { StudentLookupModule } from './platform/student-lookup/student-lookup.module.js'
import { StudentIdentityModule } from './platform/student-identity/student-identity.module.js'
import { ProfileLookupModule } from './platform/profile-lookup/profile-lookup.module.js'
import { JwtAuthGuard } from './platform/auth/index.js'
import { PermissionGuard } from './platform/access-control/permission/guards/permission.guard.js'
import { AcademicSettingModule } from './academic-setting/academic-setting.module.js'
import { AcademicYearModule } from './academic-year/academic-year.module.js'
import { CalendarModule } from './calendar/calendar.module.js'
import { ClassroomModule } from './classroom/classroom.module.js'
import { CurriculumModule } from './curriculum/curriculum.module.js'
import { EnrollmentLookupModule } from './platform/enrollment-lookup/enrollment-lookup.module.js'
import { ServiceClientModule } from './platform/service-client/service-client.module.js'
import { GradeModule } from './grade/grade.module.js'
import { AcademicCalendarTypeModule } from './reference-data/academic-calendar-type/academic-calendar-type.module.js'
import { OccupationModule } from './reference-data/occupation/occupation.module.js'
import { EducationModule } from './reference-data/education/education.module.js'
import { SemesterTypeModule } from './reference-data/semester-type/semester-type.module.js'
import { ScheduleModule as AcademicScheduleModule } from './schedule/schedule.module.js'
import { SemesterModule } from './semester/semester.module.js'
import { SubjectModule } from './subject/subject.module.js'
import { TeachingAssignmentModule } from './teaching-assignment/teaching-assignment.module.js'
import { SemesterRolloverModule } from './semester-rollover/semester-rollover.module.js'

@Module({
  imports: [
    AppConfigModule,
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
    AuthModule,
    PermissionModule,
    EmployeeIdentityModule,
    ParentLookupModule,
    EmployeeLookupModule,
    StudentLookupModule,
    StudentIdentityModule,
    ProfileLookupModule,
    AcademicSettingModule,
    AcademicYearModule,
    CalendarModule,
    ClassroomModule,
    CurriculumModule,
    ServiceClientModule,
    EnrollmentLookupModule,
    SemesterRolloverModule,
    GradeModule,
    AcademicCalendarTypeModule,
    OccupationModule,
    EducationModule,
    SemesterTypeModule,
    AcademicScheduleModule,
    SemesterModule,
    SubjectModule,
    TeachingAssignmentModule,
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
