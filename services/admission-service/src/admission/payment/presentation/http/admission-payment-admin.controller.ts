import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../../core/types/authenticated-user.type.js'
import { UPLOAD_LIMITS } from '../../../../core/upload/upload-limits.js'
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { AddPaymentUseCase } from '../../application/use-cases/add-payment/add-payment.use-case.js'
import { CancelPaymentUseCase } from '../../application/use-cases/cancel-payment/cancel-payment.use-case.js'
import { GetEligibleApplicationsUseCase } from '../../application/use-cases/get-eligible-applications/get-eligible-applications.use-case.js'
import { GetPaymentQueueUseCase } from '../../application/use-cases/get-payment-queue/get-payment-queue.use-case.js'
import { VerifyPaymentUseCase } from '../../application/use-cases/verify-payment/verify-payment.use-case.js'
import { AddAdmissionPaymentDto } from './dto/request/add-admission-payment.dto.js'
import { CancelAdmissionPaymentDto } from './dto/request/cancel-admission-payment.dto.js'
import {
  EligibleApplicationsQueryDto,
  PaymentQueueQueryDto,
} from './dto/request/payment-queue-query.dto.js'
import { VerifyPaymentDto } from './dto/request/verify-payment.dto.js'
import {
  AdmissionEligibleApplicationListResponseDto,
  AdmissionPaymentDecisionResponseDto,
  AdmissionPaymentQueueResponseDto,
} from './dto/response/admission-payment-queue-response.dto.js'

@ApiTags('Admission — Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/payments')
export class AdmissionPaymentAdminController {
  constructor(
    private readonly getQueue: GetPaymentQueueUseCase,
    private readonly getEligible: GetEligibleApplicationsUseCase,
    private readonly addPayment: AddPaymentUseCase,
    private readonly verifyPayment: VerifyPaymentUseCase,
    private readonly cancelPayment: CancelPaymentUseCase,
  ) {}

  @Get()
  @RequirePermissions('admission-payments.read')
  @ApiOperation({ summary: 'Payment queue by status, with tab counts' })
  @ApiResponse({ status: 200, type: AdmissionPaymentQueueResponseDto })
  async findAll(
    @Query() query: PaymentQueueQueryDto,
  ): Promise<AdmissionPaymentQueueResponseDto> {
    return AdmissionPaymentQueueResponseDto.fromDomain(
      await this.getQueue.execute(query),
    )
  }

  @Get('eligible-applications')
  @RequirePermissions('admission-payments.create')
  @ApiOperation({ summary: 'Applicants a payment can be added to' })
  @ApiResponse({
    status: 200,
    type: AdmissionEligibleApplicationListResponseDto,
  })
  async findEligible(
    @Query() query: EligibleApplicationsQueryDto,
  ): Promise<AdmissionEligibleApplicationListResponseDto> {
    return AdmissionEligibleApplicationListResponseDto.fromDomain(
      await this.getEligible.execute(query.search),
    )
  }

  @Post()
  @RequirePermissions('admission-payments.create')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Add a verified payment for an applicant, proof required',
  })
  @ApiResponse({ status: 201, type: AdmissionPaymentDecisionResponseDto })
  @ApiResponse({ status: 409, description: 'Gelombang penuh' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddAdmissionPaymentDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AdmissionPaymentDecisionResponseDto> {
    if (!file) {
      throw new BadRequestException('Bukti pembayaran wajib diunggah')
    }
    return AdmissionPaymentDecisionResponseDto.fromDomain(
      await this.addPayment.execute({
        applicationId: dto.applicationId,
        bankName: dto.bankName,
        bankAccountId: dto.bankAccountId,
        senderAccountName: dto.senderAccountName,
        transferDate: dto.transferDate ? new Date(dto.transferDate) : null,
        file,
        adminId: user.id,
      }),
    )
  }

  @Patch(':applicationId/verify')
  @RequirePermissions('admission-payments.verify')
  @ApiOperation({ summary: 'Verify or reject a payment proof' })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdmissionPaymentDecisionResponseDto })
  async verify(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: VerifyPaymentDto,
  ): Promise<AdmissionPaymentDecisionResponseDto> {
    return AdmissionPaymentDecisionResponseDto.fromDomain(
      await this.verifyPayment.execute({
        applicationId,
        status: dto.status,
        note: dto.note,
        adminId: user.id,
      }),
    )
  }

  @Post(':applicationId/cancel')
  @RequirePermissions('admission-payments.verify')
  @ApiOperation({ summary: 'Cancel a payment verification with a reason' })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiResponse({ status: 201, type: AdmissionPaymentDecisionResponseDto })
  @ApiResponse({
    status: 409,
    description:
      'Pembayaran tidak bisa dibatalkan setelah pendaftaran diputuskan',
  })
  async cancel(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: CancelAdmissionPaymentDto,
  ): Promise<AdmissionPaymentDecisionResponseDto> {
    return AdmissionPaymentDecisionResponseDto.fromDomain(
      await this.cancelPayment.execute({ applicationId, note: dto.note }),
    )
  }
}
