import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import { AcceptApplicationUseCase } from '../../../application/index.js'
import { AcceptManyUseCase } from '../../application/use-cases/accept-many/accept-many.use-case.js'
import { CancelAcceptanceUseCase } from '../../application/use-cases/cancel-acceptance/cancel-acceptance.use-case.js'
import { CancelRejectionUseCase } from '../../application/use-cases/cancel-rejection/cancel-rejection.use-case.js'
import { GetDecisionQueueUseCase } from '../../application/use-cases/get-decision-queue/get-decision-queue.use-case.js'
import { RejectFromQueueUseCase } from '../../application/use-cases/reject-from-queue/reject-from-queue.use-case.js'
import { AcceptDecisionDto } from './dto/request/accept-decision.dto.js'
import { AcceptManyDto } from './dto/request/accept-many.dto.js'
import { CancelDecisionDto } from './dto/request/cancel-decision.dto.js'
import { DecisionQueueQueryDto } from './dto/request/decision-queue-query.dto.js'
import { RejectDecisionDto } from './dto/request/reject-decision.dto.js'
import {
  AdmissionDecisionManyResponseDto,
  AdmissionDecisionQueueResponseDto,
  AdmissionDecisionResponseDto,
} from './dto/response/decision-response.dto.js'

@ApiTags('Admission — Decisions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/decisions')
export class AdmissionDecisionController {
  constructor(
    private readonly getQueue: GetDecisionQueueUseCase,
    private readonly acceptApplication: AcceptApplicationUseCase,
    private readonly rejectFromQueue: RejectFromQueueUseCase,
    private readonly acceptManyUseCase: AcceptManyUseCase,
    private readonly cancelAcceptanceUseCase: CancelAcceptanceUseCase,
    private readonly cancelRejectionUseCase: CancelRejectionUseCase,
  ) {}

  @Get()
  @RequirePermissions('admission-decisions.read')
  @ApiOperation({ summary: 'Decision queue by tab, with tab counts' })
  @ApiResponse({ status: 200, type: AdmissionDecisionQueueResponseDto })
  async findAll(
    @Query() query: DecisionQueueQueryDto,
  ): Promise<AdmissionDecisionQueueResponseDto> {
    return AdmissionDecisionQueueResponseDto.fromDomain(
      await this.getQueue.execute(query),
    )
  }

  @Post('accept-many')
  @RequirePermissions('admission-decisions.decide')
  @ApiOperation({ summary: 'Accept up to 50 verified applicants at once' })
  @ApiResponse({ status: 201, type: AdmissionDecisionManyResponseDto })
  async acceptMany(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AcceptManyDto,
  ): Promise<AdmissionDecisionManyResponseDto> {
    return AdmissionDecisionManyResponseDto.fromDomain(
      await this.acceptManyUseCase.execute({
        applicationIds: dto.applicationIds,
        note: dto.note,
        adminId: user.id,
      }),
    )
  }

  @Post(':applicationId/accept')
  @RequirePermissions('admission-decisions.decide')
  @ApiOperation({ summary: 'Accept a verified applicant' })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiResponse({ status: 201, type: AdmissionDecisionResponseDto })
  async accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: AcceptDecisionDto,
  ): Promise<AdmissionDecisionResponseDto> {
    return AdmissionDecisionResponseDto.fromDomain(
      await this.acceptApplication.execute(
        applicationId,
        { note: dto.note?.trim() || undefined },
        user.id,
      ),
    )
  }

  @Post(':applicationId/reject')
  @RequirePermissions('admission-decisions.decide')
  @ApiOperation({ summary: 'Reject a verified applicant, reason required' })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiResponse({ status: 201, type: AdmissionDecisionResponseDto })
  async reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: RejectDecisionDto,
  ): Promise<AdmissionDecisionResponseDto> {
    return AdmissionDecisionResponseDto.fromDomain(
      await this.rejectFromQueue.execute({
        applicationId,
        reason: dto.reason,
        adminId: user.id,
      }),
    )
  }

  @Post(':applicationId/cancel-acceptance')
  @RequirePermissions('admission-decisions.decide')
  @ApiOperation({ summary: 'Cancel an acceptance until enrolment starts' })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiResponse({ status: 201, type: AdmissionDecisionResponseDto })
  @ApiResponse({
    status: 409,
    description:
      'Penerimaan tidak bisa dibatalkan setelah proses daftar ulang dimulai',
  })
  async cancelAcceptance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: CancelDecisionDto,
  ): Promise<AdmissionDecisionResponseDto> {
    return AdmissionDecisionResponseDto.fromDomain(
      await this.cancelAcceptanceUseCase.execute({
        applicationId,
        reason: dto.reason,
        adminId: user.id,
      }),
    )
  }

  @Post(':applicationId/cancel-rejection')
  @RequirePermissions('admission-decisions.decide')
  @ApiOperation({
    summary: 'Cancel a rejection and send the applicant back to review',
  })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiResponse({ status: 201, type: AdmissionDecisionResponseDto })
  async cancelRejection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: CancelDecisionDto,
  ): Promise<AdmissionDecisionResponseDto> {
    return AdmissionDecisionResponseDto.fromDomain(
      await this.cancelRejectionUseCase.execute({
        applicationId,
        reason: dto.reason,
        adminId: user.id,
      }),
    )
  }
}
