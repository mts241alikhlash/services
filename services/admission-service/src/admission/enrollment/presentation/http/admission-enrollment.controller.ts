import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../../core/types/authenticated-user.type.js'
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { ComposeNisUseCase } from '../../application/use-cases/compose-nis/compose-nis.use-case.js'
import { GetEnrollmentQueueUseCase } from '../../application/use-cases/get-enrollment-queue/get-enrollment-queue.use-case.js'
import { LockNisUseCase } from '../../application/use-cases/lock-nis/lock-nis.use-case.js'
import { PreviewNisUseCase } from '../../application/use-cases/preview-nis/preview-nis.use-case.js'
import { ProcessEnrollmentsUseCase } from '../../application/use-cases/process-enrollments/process-enrollments.use-case.js'
import { SetPlacementUseCase } from '../../application/use-cases/set-placement/set-placement.use-case.js'
import { ComposeNisDto } from './dto/request/compose-nis.dto.js'
import { EnrollmentQueueQueryDto } from './dto/request/enrollment-queue-query.dto.js'
import { LockNisDto } from './dto/request/lock-nis.dto.js'
import { NisPreviewQueryDto } from './dto/request/nis-preview-query.dto.js'
import { ProcessEnrollmentsDto } from './dto/request/process-enrollments.dto.js'
import { SetPlacementDto } from './dto/request/set-placement.dto.js'
import {
  AdmissionEnrollmentProcessResponseDto,
  AdmissionEnrollmentQueueResponseDto,
  AdmissionNisComposeResponseDto,
  AdmissionNisLockResponseDto,
  AdmissionNisPreviewResponseDto,
  AdmissionPlacementResponseDto,
} from './dto/response/enrollment-response.dto.js'

function bearerOf(request: { headers: Record<string, string | undefined> }) {
  return (request.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
}

@ApiTags('Admission — Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/enrollments')
export class AdmissionEnrollmentController {
  constructor(
    private readonly getQueue: GetEnrollmentQueueUseCase,
    private readonly previewNis: PreviewNisUseCase,
    private readonly composeNis: ComposeNisUseCase,
    private readonly lockNis: LockNisUseCase,
    private readonly processEnrollments: ProcessEnrollmentsUseCase,
    private readonly setPlacementUseCase: SetPlacementUseCase,
  ) {}

  @Get()
  @RequirePermissions('admission-enrollments.read')
  @ApiOperation({
    summary: 'Enrollment queue by tab, with tab counts and school years',
  })
  @ApiResponse({ status: 200, type: AdmissionEnrollmentQueueResponseDto })
  async findAll(
    @Query() query: EnrollmentQueueQueryDto,
  ): Promise<AdmissionEnrollmentQueueResponseDto> {
    return AdmissionEnrollmentQueueResponseDto.fromDomain(
      await this.getQueue.execute(query),
    )
  }

  @Get('nis-preview')
  @RequirePermissions('admission-enrollments.nis')
  @ApiOperation({ summary: 'The NIS that composing a school year would give' })
  @ApiResponse({ status: 200, type: AdmissionNisPreviewResponseDto })
  async preview(
    @Query() query: NisPreviewQueryDto,
  ): Promise<AdmissionNisPreviewResponseDto> {
    return AdmissionNisPreviewResponseDto.fromDomain(
      await this.previewNis.execute(query.academicYearId),
    )
  }

  @Post('nis')
  @RequirePermissions('admission-enrollments.nis')
  @ApiOperation({ summary: 'Compose the NIS of a school year' })
  @ApiResponse({ status: 201, type: AdmissionNisComposeResponseDto })
  @ApiResponse({
    status: 409,
    description: 'Hasil susun NIS berubah, lihat pratinjau lagi',
  })
  async compose(
    @Body() dto: ComposeNisDto,
    @Req() request: { headers: Record<string, string | undefined> },
  ): Promise<AdmissionNisComposeResponseDto> {
    return AdmissionNisComposeResponseDto.fromDomain(
      await this.composeNis.execute({
        academicYearId: dto.academicYearId,
        expectedChanges: dto.expectedChanges,
        syncStudents: dto.syncStudents,
        bearerToken: bearerOf(request),
      }),
    )
  }

  @Post('nis-lock')
  @RequirePermissions('admission-enrollments.nis')
  @ApiOperation({ summary: 'Lock the NIS of a school year for good' })
  @ApiResponse({ status: 201, type: AdmissionNisLockResponseDto })
  async lock(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LockNisDto,
  ): Promise<AdmissionNisLockResponseDto> {
    return AdmissionNisLockResponseDto.fromDomain(
      await this.lockNis.execute({
        academicYearId: dto.academicYearId,
        lockedById: user.id,
      }),
    )
  }

  @Post('process')
  @RequirePermissions('admission-enrollments.process')
  @ApiOperation({ summary: 'Enroll up to 50 accepted applicants as students' })
  @ApiResponse({ status: 201, type: AdmissionEnrollmentProcessResponseDto })
  async process(
    @Body() dto: ProcessEnrollmentsDto,
    @Req() request: { headers: Record<string, string | undefined> },
  ): Promise<AdmissionEnrollmentProcessResponseDto> {
    return AdmissionEnrollmentProcessResponseDto.fromDomain(
      await this.processEnrollments.execute({
        applicationIds: dto.applicationIds,
        nisn: dto.nisn,
        bearerToken: bearerOf(request),
      }),
    )
  }

  @Patch(':applicationId/placement')
  @RequirePermissions('admission-enrollments.process')
  @ApiOperation({ summary: 'Set the admission type and the target grade' })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdmissionPlacementResponseDto })
  async setPlacement(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: SetPlacementDto,
  ): Promise<AdmissionPlacementResponseDto> {
    return AdmissionPlacementResponseDto.fromDomain(
      await this.setPlacementUseCase.execute({
        applicationId,
        admissionType: dto.admissionType,
        targetGradeId: dto.targetGradeId,
      }),
    )
  }
}
