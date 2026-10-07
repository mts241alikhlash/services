import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { GetDocumentReviewQueueUseCase } from '../../application/use-cases/get-document-review-queue/get-document-review-queue.use-case.js'
import { GetDocumentReviewUseCase } from '../../application/use-cases/get-document-review/get-document-review.use-case.js'
import { SaveDocumentDecisionUseCase } from '../../application/use-cases/save-document-decision/save-document-decision.use-case.js'
import { SendDocumentReviewUseCase } from '../../application/use-cases/send-document-review/send-document-review.use-case.js'
import { DocumentReviewQueryDto } from './dto/request/document-review-query.dto.js'
import { SaveDocumentDecisionDto } from './dto/request/save-document-decision.dto.js'
import { SendDocumentReviewDto } from './dto/request/send-document-review.dto.js'
import {
  AdmissionDocumentReviewDocumentResponseDto,
  AdmissionDocumentReviewQueueResponseDto,
  AdmissionDocumentReviewResponseDto,
  AdmissionDocumentReviewSendResponseDto,
} from './dto/response/document-review-response.dto.js'

@ApiTags('Admission — Document review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/document-reviews')
export class AdmissionDocumentReviewController {
  constructor(
    private readonly getQueue: GetDocumentReviewQueueUseCase,
    private readonly getReview: GetDocumentReviewUseCase,
    private readonly saveDecision: SaveDocumentDecisionUseCase,
    private readonly sendReview: SendDocumentReviewUseCase,
  ) {}

  @Get()
  @RequirePermissions('admission-documents.read')
  @ApiOperation({ summary: 'Document review queue by tab, with tab counts' })
  @ApiResponse({ status: 200, type: AdmissionDocumentReviewQueueResponseDto })
  async findAll(
    @Query() query: DocumentReviewQueryDto,
  ): Promise<AdmissionDocumentReviewQueueResponseDto> {
    return AdmissionDocumentReviewQueueResponseDto.fromDomain(
      await this.getQueue.execute(query),
    )
  }

  @Get(':applicationId')
  @RequirePermissions('admission-documents.read')
  @ApiOperation({ summary: 'An applicant with every active document type' })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdmissionDocumentReviewResponseDto })
  async findOne(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ): Promise<AdmissionDocumentReviewResponseDto> {
    return AdmissionDocumentReviewResponseDto.fromDomain(
      await this.getReview.execute(applicationId),
    )
  }

  @Patch(':applicationId/documents/:documentId')
  @RequirePermissions('admission-documents.verify')
  @ApiOperation({
    summary: 'Save an approve or reject decision without telling the applicant',
  })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiParam({ name: 'documentId', format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: AdmissionDocumentReviewDocumentResponseDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'Keputusan berkas hanya bisa diubah selama pendaftaran menunggu pemeriksaan',
  })
  async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: SaveDocumentDecisionDto,
  ): Promise<AdmissionDocumentReviewDocumentResponseDto> {
    return AdmissionDocumentReviewDocumentResponseDto.fromDomain(
      await this.saveDecision.execute({
        applicationId,
        documentId,
        status: dto.status,
        note: dto.note,
        adminId: user.id,
      }),
    )
  }

  @Post(':applicationId/send')
  @RequirePermissions('admission-documents.verify')
  @ApiOperation({
    summary: 'Send the review result to the applicant, once',
  })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiResponse({
    status: 201,
    type: AdmissionDocumentReviewSendResponseDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'Masih ada berkas wajib yang belum diputuskan atau belum diunggah',
  })
  async send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: SendDocumentReviewDto,
  ): Promise<AdmissionDocumentReviewSendResponseDto> {
    return AdmissionDocumentReviewSendResponseDto.fromDomain(
      await this.sendReview.execute({
        applicationId,
        dataNote: dto.dataNote,
        adminId: user.id,
      }),
    )
  }
}
