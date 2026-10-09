import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { UPLOAD_LIMITS } from '../../../../core/upload/upload-limits.js'
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { DeleteDownloadUseCase } from '../../application/use-cases/delete-download/delete-download.use-case.js'
import { GetDownloadsUseCase } from '../../application/use-cases/get-downloads/get-downloads.use-case.js'
import { ReorderDownloadsUseCase } from '../../application/use-cases/reorder-downloads/reorder-downloads.use-case.js'
import { SaveDownloadUseCase } from '../../application/use-cases/save-download/save-download.use-case.js'
import {
  CreateAdmissionDownloadDto,
  ReorderAdmissionDownloadsDto,
  UpdateAdmissionDownloadDto,
} from './dto/request/save-admission-download.dto.js'
import {
  AdmissionDownloadListResponseDto,
  AdmissionDownloadResponseDto,
} from './dto/response/admission-download-response.dto.js'

const MULTIPART_BODY = {
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string', maxLength: 100 },
      description: { type: 'string', maxLength: 255 },
      isActive: { type: 'boolean' },
      file: { type: 'string', format: 'binary' },
    },
  },
} as const

@ApiTags('Admission — Downloads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/downloads')
export class AdmissionDownloadController {
  constructor(
    private readonly getDownloads: GetDownloadsUseCase,
    private readonly saveDownload: SaveDownloadUseCase,
    private readonly reorderDownloads: ReorderDownloadsUseCase,
    private readonly deleteDownload: DeleteDownloadUseCase,
  ) {}

  @Get()
  @RequirePermissions('admission-downloads.read')
  @ApiOperation({ summary: 'List every download file, inactive included' })
  @ApiResponse({ status: 200, type: AdmissionDownloadListResponseDto })
  async findAll(): Promise<AdmissionDownloadListResponseDto> {
    return AdmissionDownloadListResponseDto.fromDomain(
      await this.getDownloads.all(),
    )
  }

  @Post()
  @RequirePermissions('admission-downloads.create')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiConsumes('multipart/form-data')
  @ApiBody(MULTIPART_BODY)
  @ApiOperation({ summary: 'Add a PDF at the end of the list' })
  @ApiResponse({ status: 201, type: AdmissionDownloadResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Berkas harus PDF dan maksimal 5 MB',
  })
  @ApiResponse({ status: 409, description: 'Judul berkas sudah ada' })
  async create(
    @Body() dto: CreateAdmissionDownloadDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<AdmissionDownloadResponseDto> {
    return AdmissionDownloadResponseDto.fromDomain(
      await this.saveDownload.create({ ...dto, file }),
    )
  }

  @Put('order')
  @RequirePermissions('admission-downloads.update')
  @ApiOperation({ summary: 'Reorder every download file' })
  @ApiResponse({ status: 200, type: AdmissionDownloadListResponseDto })
  @ApiResponse({ status: 400, description: 'Urutan berkas tidak lengkap' })
  async reorder(
    @Body() dto: ReorderAdmissionDownloadsDto,
  ): Promise<AdmissionDownloadListResponseDto> {
    return AdmissionDownloadListResponseDto.fromDomain(
      await this.reorderDownloads.execute(dto.ids),
    )
  }

  @Patch(':id')
  @RequirePermissions('admission-downloads.update')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiConsumes('multipart/form-data')
  @ApiBody(MULTIPART_BODY)
  @ApiOperation({
    summary: 'Rename, describe, (de)activate or replace the PDF',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdmissionDownloadResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Berkas harus PDF dan maksimal 5 MB',
  })
  @ApiResponse({ status: 404, description: 'Berkas tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Judul berkas sudah ada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdmissionDownloadDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<AdmissionDownloadResponseDto> {
    return AdmissionDownloadResponseDto.fromDomain(
      await this.saveDownload.update(id, { ...dto, file }),
    )
  }

  @Delete(':id')
  @RequirePermissions('admission-downloads.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a download file and its stored PDF' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Berkas tidak ditemukan' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteDownload.execute(id)
  }
}
