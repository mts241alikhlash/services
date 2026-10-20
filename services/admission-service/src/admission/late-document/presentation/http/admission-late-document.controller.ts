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
import { UPLOAD_LIMITS } from '../../../../core/upload/upload-limits.js'
import type { AuthenticatedUser } from '../../../../core/types/authenticated-user.type.js'
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { DecideLateDocumentUseCase } from '../../application/use-cases/decide-late-document/decide-late-document.use-case.js'
import { GetLateDocumentsUseCase } from '../../application/use-cases/get-late-documents/get-late-documents.use-case.js'
import { UploadLateDocumentUseCase } from '../../application/use-cases/upload-late-document/upload-late-document.use-case.js'
import { DecideLateDocumentDto } from './dto/request/decide-late-document.dto.js'
import { LateDocumentQueryDto } from './dto/request/late-document-query.dto.js'
import {
  AdmissionLateDocumentListResponseDto,
  AdmissionLateDocumentSavedResponseDto,
} from './dto/response/late-document-response.dto.js'

@ApiTags('Admission — Late documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/late-documents')
export class AdmissionLateDocumentController {
  constructor(
    private readonly getLateDocuments: GetLateDocumentsUseCase,
    private readonly uploadLateDocument: UploadLateDocumentUseCase,
    private readonly decideLateDocument: DecideLateDocumentUseCase,
  ) {}

  @Get()
  @RequirePermissions('admission-late-documents.read')
  @ApiOperation({
    summary:
      'Late documents of the PPDB academic year, one row per student and type',
  })
  @ApiResponse({ status: 200, type: AdmissionLateDocumentListResponseDto })
  async findAll(
    @Query() query: LateDocumentQueryDto,
  ): Promise<AdmissionLateDocumentListResponseDto> {
    return AdmissionLateDocumentListResponseDto.fromDomain(
      await this.getLateDocuments.execute(query),
    )
  }

  @Post(':applicationId/documents/:documentTypeId')
  @RequirePermissions('admission-late-documents.upload')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload or replace a late document for an applicant',
  })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiParam({ name: 'documentTypeId', format: 'uuid' })
  @ApiResponse({ status: 201, type: AdmissionLateDocumentSavedResponseDto })
  @ApiResponse({ status: 409, description: 'Berkas sudah disetujui' })
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('documentTypeId', ParseUUIDPipe) documentTypeId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AdmissionLateDocumentSavedResponseDto> {
    if (!file) throw new BadRequestException('Berkas wajib diunggah')
    return AdmissionLateDocumentSavedResponseDto.fromDomain(
      await this.uploadLateDocument.execute({
        applicationId,
        documentTypeId,
        file,
        adminId: user.id,
      }),
    )
  }

  @Patch(':applicationId/documents/:documentId')
  @RequirePermissions('admission-late-documents.verify')
  @ApiOperation({ summary: 'Approve or reject a late document' })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiParam({ name: 'documentId', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdmissionLateDocumentSavedResponseDto })
  async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: DecideLateDocumentDto,
  ): Promise<AdmissionLateDocumentSavedResponseDto> {
    return AdmissionLateDocumentSavedResponseDto.fromDomain(
      await this.decideLateDocument.execute({
        applicationId,
        documentId,
        status: dto.status,
        note: dto.note,
        adminId: user.id,
      }),
    )
  }
}
