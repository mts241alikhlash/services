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
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { UpdateMyApplicationDto } from './dto/request/update-my-application.dto.js'
import {
  UploadPaymentProofUseCase,
  type UploadPaymentProofInput,
} from '../../../payment/index.js'
import { UploadPaymentProofDto } from '../../../payment/presentation/http/dto/request/upload-payment-proof.dto.js'
import {
  EnsureMyApplicationUseCase,
  GetMyApplicationUseCase,
  SubmitApplicationUseCase,
  UpdateMyApplicationUseCase,
} from '../../index.js'
import { GetPublishedAnnouncementsUseCase } from '../../../announcement/index.js'
import { UploadAdmissionDocumentUseCase } from '../../../document/index.js'
import { ApplicationDetailResponseDto } from '../../../application/presentation/http/dto/response/admission-admin-registration-response.dto.js'

@ApiTags('Admission — Applicant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions')
export class AdmissionApplicantController {
  constructor(
    private readonly getMyApplicationService: GetMyApplicationUseCase,
    private readonly ensureMyApplicationService: EnsureMyApplicationUseCase,
    private readonly updateMyApplicationService: UpdateMyApplicationUseCase,
    private readonly submitApplicationService: SubmitApplicationUseCase,
    private readonly uploadDocumentService: UploadAdmissionDocumentUseCase,
    private readonly uploadPaymentProofService: UploadPaymentProofUseCase,
    private readonly getAnnouncementsService: GetPublishedAnnouncementsUseCase,
  ) {}

  @Get('my-application')
  @ApiOperation({
    summary: 'Get my application (form, documents, payment, wave)',
  })
  @ApiResponse({ status: 200, description: 'Application detail' })
  @ApiResponse({ status: 404, description: 'No application for this account' })
  async getMyApplication(@CurrentUser() user: AuthenticatedUser) {
    return this.getMyApplicationService.execute(user.id)
  }

  @Post('my-application/ensure')
  @ApiOperation({ summary: 'Ensure my application exists (idempotent)' })
  @ApiResponse({
    status: 200,
    description: 'Application already existed',
    type: ApplicationDetailResponseDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Application created',
    type: ApplicationDetailResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Registration is not open' })
  async ensureMyApplication(@CurrentUser() user: AuthenticatedUser) {
    return this.ensureMyApplicationService.execute({ userId: user.id })
  }

  @Patch('my-application')
  @ApiOperation({
    summary: 'Update my application form (partial, per wizard step)',
  })
  @ApiResponse({ status: 200, description: 'Application updated' })
  @ApiResponse({ status: 409, description: 'Not editable in current status' })
  async updateMyApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMyApplicationDto,
  ) {
    const { birthDate, parents, ...fields } = dto
    return this.updateMyApplicationService.execute(user.id, {
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

  @Post('my-application/submit')
  @ApiOperation({ summary: 'Submit my application for verification' })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  @ApiResponse({ status: 400, description: 'Incomplete data or documents' })
  async submit(@CurrentUser() user: AuthenticatedUser) {
    return this.submitApplicationService.execute(user.id)
  }

  @Put('my-application/documents/:typeCode')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload (or replace) a required document' })
  @ApiParam({ name: 'typeCode', example: 'KK' })
  @ApiResponse({ status: 200, description: 'Document uploaded' })
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('typeCode') typeCode: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadDocumentService.execute({
      userId: user.id,
      documentTypeCode: typeCode,
      file,
    })
  }

  @Put('my-application/payment')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload payment transfer proof' })
  @ApiResponse({ status: 200, description: 'Payment proof uploaded' })
  async uploadPaymentProof(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadPaymentProofDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const input: UploadPaymentProofInput = {
      userId: user.id,
      bankName: dto.bankName,
      senderAccountName: dto.senderAccountName,
      transferDate: dto.transferDate ? new Date(dto.transferDate) : null,
      file,
    }
    return this.uploadPaymentProofService.execute(input)
  }

  @Get('announcements')
  @ApiOperation({ summary: 'Published announcements for my wave (or global)' })
  async getAnnouncements(@CurrentUser() user: AuthenticatedUser) {
    return this.getAnnouncementsService.execute(user.id)
  }
}
