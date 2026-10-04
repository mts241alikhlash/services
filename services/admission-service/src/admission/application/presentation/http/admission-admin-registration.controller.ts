import {
  AdmissionApplicationFormResponseDto,
  AdmissionDocumentResponseDto,
  AdmissionPaymentResponseDto,
  AdmissionRegisteredApplicantResponseDto,
} from './dto/response/admission-application-response.dto.js'
import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
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
import { RegisterApplicantDto } from '../../../applicant/presentation/http/dto/request/register-applicant.dto.js'
import { toUpdateInput } from '../../../applicant/presentation/http/dto/request/update-my-application.mapper.js'
import { UpdateMyApplicationDto } from '../../../applicant/presentation/http/dto/request/update-my-application.dto.js'
import { UploadPaymentProofDto } from '../../../payment/presentation/http/dto/request/upload-payment-proof.dto.js'
import {
  RegisterApplicantUseCase,
  SubmitApplicationUseCase,
  UpdateMyApplicationUseCase,
} from '../../../applicant/index.js'
import {
  UploadAdmissionDocumentUseCase,
  UploadAttachmentUseCase,
} from '../../../document/index.js'
import { AdmissionAttachmentResponseDto } from '../../../document/presentation/http/dto/response/admission-attachment-response.dto.js'
import { UploadPaymentProofUseCase } from '../../../payment/index.js'
import { UPLOAD_LIMITS } from '../../../../core/upload/upload-limits.js'

@ApiTags('Admission — Admin Registration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/applications')
export class AdmissionAdminRegistrationController {
  constructor(
    private readonly registerApplicantService: RegisterApplicantUseCase,
    private readonly updateApplicationService: UpdateMyApplicationUseCase,
    private readonly submitApplicationService: SubmitApplicationUseCase,
    private readonly uploadDocumentService: UploadAdmissionDocumentUseCase,
    private readonly uploadAttachmentService: UploadAttachmentUseCase,
    private readonly uploadPaymentProofService: UploadPaymentProofUseCase,
  ) {}

  @Post()
  @RequirePermissions('admissions.create')
  @ApiOperation({
    summary: 'Create an applicant account and a DRAFT application',
  })
  @ApiResponse({
    status: 201,
    description: 'Applicant registered',
    type: AdmissionRegisteredApplicantResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterApplicantDto,
  ): Promise<AdmissionRegisteredApplicantResponseDto> {
    return AdmissionRegisteredApplicantResponseDto.fromDomain(
      await this.registerApplicantService.execute({
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        password: dto.password,
        passwordConfirm: dto.passwordConfirm,
        waveId: dto.waveId,
      }),
    )
  }

  @Patch(':id/form')
  @RequirePermissions('admissions.create')
  @ApiOperation({
    summary: 'Fill a step of an application on behalf of its owner',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Application detail',
    type: AdmissionApplicationFormResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Not editable in current status' })
  async updateForm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMyApplicationDto,
  ): Promise<AdmissionApplicationFormResponseDto> {
    return AdmissionApplicationFormResponseDto.fromDomain(
      await this.updateApplicationService.executeForApplication(
        id,
        toUpdateInput(dto),
      ),
    )
  }

  @Post(':id/submit')
  @RequirePermissions('admissions.create')
  @ApiOperation({ summary: 'Submit an application on behalf of its owner' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Application submitted',
    type: AdmissionApplicationFormResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Incomplete data or documents' })
  async submit(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdmissionApplicationFormResponseDto> {
    return AdmissionApplicationFormResponseDto.fromDomain(
      await this.submitApplicationService.executeForApplication(id),
    )
  }

  @Put(':id/documents/:typeCode')
  @RequirePermissions('admissions.create')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a required document for an application' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'typeCode', example: 'KK' })
  @ApiResponse({
    status: 200,
    description: 'Document uploaded',
    type: AdmissionDocumentResponseDto,
  })
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('typeCode') typeCode: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AdmissionDocumentResponseDto> {
    return AdmissionDocumentResponseDto.fromDomain(
      await this.uploadDocumentService.executeForApplication({
        applicationId: id,
        documentTypeCode: typeCode,
        file,
        adminId: user.id,
      }),
    )
  }

  @Post(':id/attachments')
  @RequirePermissions('admissions.create')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload an attachment for an application on behalf of its owner',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Attachment stored',
    type: AdmissionAttachmentResponseDto,
  })
  async uploadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AdmissionAttachmentResponseDto> {
    return AdmissionAttachmentResponseDto.fromDomain(
      await this.uploadAttachmentService.executeForApplication(
        id,
        file,
        user.id,
      ),
    )
  }

  @Put(':id/payment')
  @RequirePermissions('admissions.create')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload payment proof for an application' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Payment proof uploaded',
    type: AdmissionPaymentResponseDto,
  })
  async uploadPaymentProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadPaymentProofDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AdmissionPaymentResponseDto> {
    return AdmissionPaymentResponseDto.fromDomain(
      await this.uploadPaymentProofService.executeForApplication({
        applicationId: id,
        bankName: dto.bankName,
        bankAccountId: dto.bankAccountId,
        senderAccountName: dto.senderAccountName,
        transferDate: dto.transferDate ? new Date(dto.transferDate) : null,
        file,
        adminId: user.id,
      }),
    )
  }
}
