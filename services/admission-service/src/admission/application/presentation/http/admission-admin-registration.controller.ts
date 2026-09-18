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
import { UpdateMyApplicationDto } from '../../../applicant/presentation/http/dto/request/update-my-application.dto.js'
import { UploadPaymentProofDto } from '../../../payment/presentation/http/dto/request/upload-payment-proof.dto.js'
import {
  ApplicationDetailResponseDto,
  ApplicationDocumentResponseDto,
  ApplicationPaymentResponseDto,
  RegisteredApplicantResponseDto,
} from './dto/response/admission-admin-registration-response.dto.js'
import {
  RegisterApplicantUseCase,
  SubmitApplicationUseCase,
  UpdateMyApplicationUseCase,
} from '../../../applicant/index.js'
import { UploadAdmissionDocumentUseCase } from '../../../document/index.js'
import { UploadPaymentProofUseCase } from '../../../payment/index.js'

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
    type: RegisteredApplicantResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterApplicantDto) {
    return this.registerApplicantService.execute({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
      passwordConfirm: dto.passwordConfirm,
      waveId: dto.waveId,
    })
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
    type: ApplicationDetailResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Not editable in current status' })
  async updateForm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMyApplicationDto,
  ) {
    const { birthDate, parents, ...fields } = dto
    return this.updateApplicationService.executeForApplication(id, {
      ...fields,
      ...(birthDate !== undefined && {
        birthDate: new Date(birthDate),
      }),
      parents: parents?.map((parent) => ({
        relation: parent.relation,
        name: parent.name,
        nik: parent.nik ?? null,
        birthPlace: parent.birthPlace ?? null,
        birthDate: parent.birthDate ? new Date(parent.birthDate) : null,
        phone: parent.phone ?? null,
        occupationId: parent.occupationId ?? null,
        educationId: parent.educationId ?? null,
        income: parent.income ?? null,
        isPrimary: parent.isPrimary ?? false,
      })),
    })
  }

  @Post(':id/submit')
  @RequirePermissions('admissions.create')
  @ApiOperation({ summary: 'Submit an application on behalf of its owner' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Application submitted',
    type: ApplicationDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Incomplete data or documents' })
  async submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.submitApplicationService.executeForApplication(id)
  }

  @Put(':id/documents/:typeCode')
  @RequirePermissions('admissions.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a required document for an application' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'typeCode', example: 'KK' })
  @ApiResponse({
    status: 200,
    description: 'Document uploaded',
    type: ApplicationDocumentResponseDto,
  })
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('typeCode') typeCode: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadDocumentService.executeForApplication({
      applicationId: id,
      documentTypeCode: typeCode,
      file,
      adminId: user.id,
    })
  }

  @Put(':id/payment')
  @RequirePermissions('admissions.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload payment proof for an application' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Payment proof uploaded',
    type: ApplicationPaymentResponseDto,
  })
  async uploadPaymentProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadPaymentProofDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadPaymentProofService.executeForApplication({
      applicationId: id,
      bankName: dto.bankName,
      senderAccountName: dto.senderAccountName,
      transferDate: dto.transferDate ? new Date(dto.transferDate) : null,
      file,
      adminId: user.id,
    })
  }
}
