import {
  AdmissionApplicationFormResponseDto,
  AdmissionDocumentResponseDto,
  AdmissionPaymentResponseDto,
  MyAdmissionApplicationResponseDto,
} from '../../../application/presentation/http/dto/response/admission-application-response.dto.js'
import { AdmissionAnnouncementResponseDto } from '../../../announcement/presentation/http/dto/response/admission-announcement-response.dto.js'
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { AdmissionFormOptionsResponseDto } from './dto/response/admission-form-options-response.dto.js'
import { toUpdateInput } from './dto/request/update-my-application.mapper.js'
import { UpdateMyApplicationDto } from './dto/request/update-my-application.dto.js'
import {
  UploadPaymentProofUseCase,
  type UploadPaymentProofInput,
} from '../../../payment/index.js'
import { UploadPaymentProofDto } from '../../../payment/presentation/http/dto/request/upload-payment-proof.dto.js'
import {
  EnsureMyApplicationUseCase,
  GetFormOptionsUseCase,
  GetMyApplicationUseCase,
  SubmitApplicationUseCase,
  UpdateMyApplicationUseCase,
} from '../../index.js'
import { GetPublishedAnnouncementsUseCase } from '../../../announcement/index.js'
import {
  UploadAdmissionDocumentUseCase,
  UploadAttachmentUseCase,
} from '../../../document/index.js'
import { AdmissionAttachmentResponseDto } from '../../../document/presentation/http/dto/response/admission-attachment-response.dto.js'
import { UPLOAD_LIMITS } from '../../../../core/upload/upload-limits.js'

@ApiTags('Admission — Applicant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions')
export class AdmissionApplicantController {
  constructor(
    private readonly getMyApplicationService: GetMyApplicationUseCase,
    private readonly getFormOptionsService: GetFormOptionsUseCase,
    private readonly ensureMyApplicationService: EnsureMyApplicationUseCase,
    private readonly updateMyApplicationService: UpdateMyApplicationUseCase,
    private readonly submitApplicationService: SubmitApplicationUseCase,
    private readonly uploadDocumentService: UploadAdmissionDocumentUseCase,
    private readonly uploadAttachmentService: UploadAttachmentUseCase,
    private readonly uploadPaymentProofService: UploadPaymentProofUseCase,
    private readonly getAnnouncementsService: GetPublishedAnnouncementsUseCase,
  ) {}

  @Get('form-options')
  @ApiOperation({ summary: 'Every choice list the application form offers' })
  @ApiResponse({ status: 200, type: AdmissionFormOptionsResponseDto })
  async getFormOptions(): Promise<AdmissionFormOptionsResponseDto> {
    return AdmissionFormOptionsResponseDto.fromDomain(
      await this.getFormOptionsService.execute(),
    )
  }

  @Get('my-application')
  @RequirePermissions('admissions.apply')
  @ApiOperation({
    summary: 'Get my application (form, documents, payment, wave)',
  })
  @ApiResponse({
    type: MyAdmissionApplicationResponseDto,
    status: 200,
    description: 'Application detail',
  })
  @ApiResponse({ status: 404, description: 'No application for this account' })
  async getMyApplication(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyAdmissionApplicationResponseDto> {
    return MyAdmissionApplicationResponseDto.fromDomain(
      await this.getMyApplicationService.execute(user.id),
    )
  }

  @Post('my-application/ensure')
  @RequirePermissions('admissions.apply')
  @ApiOperation({ summary: 'Ensure my application exists (idempotent)' })
  @ApiResponse({
    status: 200,
    description: 'Application already existed',
    type: MyAdmissionApplicationResponseDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Application created',
    type: MyAdmissionApplicationResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Registration is not open' })
  async ensureMyApplication(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyAdmissionApplicationResponseDto> {
    return MyAdmissionApplicationResponseDto.fromDomain(
      await this.ensureMyApplicationService.execute({ userId: user.id }),
    )
  }

  @Patch('my-application')
  @RequirePermissions('admissions.apply')
  @ApiOperation({
    summary: 'Update my application form (partial, per wizard step)',
  })
  @ApiResponse({
    type: AdmissionApplicationFormResponseDto,
    status: 200,
    description: 'Application updated',
  })
  @ApiResponse({ status: 409, description: 'Not editable in current status' })
  async updateMyApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMyApplicationDto,
  ): Promise<AdmissionApplicationFormResponseDto> {
    return AdmissionApplicationFormResponseDto.fromDomain(
      await this.updateMyApplicationService.execute(
        user.id,
        toUpdateInput(dto),
      ),
    )
  }

  @Post('my-application/submit')
  @RequirePermissions('admissions.apply')
  @ApiOperation({ summary: 'Submit my application for verification' })
  @ApiResponse({
    type: AdmissionApplicationFormResponseDto,
    status: 201,
    description: 'Application submitted',
  })
  @ApiResponse({ status: 400, description: 'Incomplete data or documents' })
  async submit(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdmissionApplicationFormResponseDto> {
    return AdmissionApplicationFormResponseDto.fromDomain(
      await this.submitApplicationService.execute(user.id),
    )
  }

  @Put('my-application/documents/:typeCode')
  @RequirePermissions('admissions.apply')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload (or replace) a required document' })
  @ApiParam({ name: 'typeCode', example: 'KK' })
  @ApiResponse({
    type: AdmissionDocumentResponseDto,
    status: 200,
    description: 'Document uploaded',
  })
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('typeCode') typeCode: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AdmissionDocumentResponseDto> {
    return AdmissionDocumentResponseDto.fromDomain(
      await this.uploadDocumentService.execute({
        userId: user.id,
        documentTypeCode: typeCode,
        file,
      }),
    )
  }

  @Post('my-application/attachments')
  @RequirePermissions('admissions.apply')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload an attachment for an achievement or scholarship row',
  })
  @ApiResponse({
    status: 201,
    description: 'Attachment stored',
    type: AdmissionAttachmentResponseDto,
  })
  async uploadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AdmissionAttachmentResponseDto> {
    return AdmissionAttachmentResponseDto.fromDomain(
      await this.uploadAttachmentService.execute(user.id, file),
    )
  }

  @Put('my-application/payment')
  @RequirePermissions('admissions.apply')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload payment transfer proof' })
  @ApiResponse({
    type: AdmissionPaymentResponseDto,
    status: 200,
    description: 'Payment proof uploaded',
  })
  async uploadPaymentProof(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadPaymentProofDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AdmissionPaymentResponseDto> {
    const input: UploadPaymentProofInput = {
      userId: user.id,
      bankName: dto.bankName,
      bankAccountId: dto.bankAccountId,
      senderAccountName: dto.senderAccountName,
      transferDate: dto.transferDate ? new Date(dto.transferDate) : null,
      file,
    }
    return AdmissionPaymentResponseDto.fromDomain(
      await this.uploadPaymentProofService.execute(input),
    )
  }

  @Get('announcements')
  @ApiOperation({ summary: 'Published announcements for my wave (or global)' })
  async getAnnouncements(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdmissionAnnouncementResponseDto[]> {
    return (await this.getAnnouncementsService.execute(user.id)).map((item) =>
      AdmissionAnnouncementResponseDto.fromDomain(item),
    )
  }
}
