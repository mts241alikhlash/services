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
import { GetEnrolmentQueueUseCase } from '../../application/use-cases/get-enrolment-queue/get-enrolment-queue.use-case.js'
import { LockNisUseCase } from '../../application/use-cases/lock-nis/lock-nis.use-case.js'
import { PreviewNisUseCase } from '../../application/use-cases/preview-nis/preview-nis.use-case.js'
import { ProcessEnrolmentsUseCase } from '../../application/use-cases/process-enrolments/process-enrolments.use-case.js'
import { SetPlacementUseCase } from '../../application/use-cases/set-placement/set-placement.use-case.js'
import { ComposeNisDto } from './dto/request/compose-nis.dto.js'
import { EnrolmentQueueQueryDto } from './dto/request/enrolment-queue-query.dto.js'
import { LockNisDto } from './dto/request/lock-nis.dto.js'
import { NisPreviewQueryDto } from './dto/request/nis-preview-query.dto.js'
import { ProcessEnrolmentsDto } from './dto/request/process-enrolments.dto.js'
import { SetPlacementDto } from './dto/request/set-placement.dto.js'
import {
  AdmissionEnrolmentProcessResponseDto,
  AdmissionEnrolmentQueueResponseDto,
  AdmissionNisComposeResponseDto,
  AdmissionNisLockResponseDto,
  AdmissionNisPreviewResponseDto,
  AdmissionPlacementResponseDto,
} from './dto/response/enrolment-response.dto.js'

function bearerOf(request: { headers: Record<string, string | undefined> }) {
  return (request.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
}

@ApiTags('Admission — Enrolments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/enrolments')
export class AdmissionEnrolmentController {
  constructor(
    private readonly getQueue: GetEnrolmentQueueUseCase,
    private readonly previewNis: PreviewNisUseCase,
    private readonly composeNis: ComposeNisUseCase,
    private readonly lockNis: LockNisUseCase,
    private readonly processEnrolments: ProcessEnrolmentsUseCase,
    private readonly setPlacementUseCase: SetPlacementUseCase,
  ) {}

  @Get()
  @RequirePermissions('admission-enrolments.read')
  @ApiOperation({
    summary: 'Enrolment queue by tab, with tab counts and school years',
  })
  @ApiResponse({ status: 200, type: AdmissionEnrolmentQueueResponseDto })
  async findAll(
    @Query() query: EnrolmentQueueQueryDto,
  ): Promise<AdmissionEnrolmentQueueResponseDto> {
    return AdmissionEnrolmentQueueResponseDto.fromDomain(
      await this.getQueue.execute(query),
    )
  }

  @Get('nis-preview')
  @RequirePermissions('admission-enrolments.nis')
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
  @RequirePermissions('admission-enrolments.nis')
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
  @RequirePermissions('admission-enrolments.nis')
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
  @RequirePermissions('admission-enrolments.process')
  @ApiOperation({ summary: 'Enrol up to 50 accepted applicants as students' })
  @ApiResponse({ status: 201, type: AdmissionEnrolmentProcessResponseDto })
  async process(
    @Body() dto: ProcessEnrolmentsDto,
    @Req() request: { headers: Record<string, string | undefined> },
  ): Promise<AdmissionEnrolmentProcessResponseDto> {
    return AdmissionEnrolmentProcessResponseDto.fromDomain(
      await this.processEnrolments.execute({
        applicationIds: dto.applicationIds,
        nisn: dto.nisn,
        bearerToken: bearerOf(request),
      }),
    )
  }

  @Patch(':applicationId/placement')
  @RequirePermissions('admission-enrolments.process')
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
