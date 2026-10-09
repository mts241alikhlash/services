import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Res,
  StreamableFile,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { Public } from '../../../../core/decorators/public.decorator.js'
import { contentDisposition } from '../../../file/presentation/http/content-disposition.js'
import { GetDownloadFileUseCase } from '../../application/use-cases/get-download-file/get-download-file.use-case.js'
import { GetDownloadsUseCase } from '../../application/use-cases/get-downloads/get-downloads.use-case.js'
import { AdmissionActiveDownloadListResponseDto } from './dto/response/admission-download-response.dto.js'

@ApiTags('Admission — Public')
@Controller('admissions/downloads')
export class AdmissionDownloadPublicController {
  constructor(
    private readonly getDownloads: GetDownloadsUseCase,
    private readonly getDownloadFile: GetDownloadFileUseCase,
  ) {}

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Active download files (landing page)' })
  @ApiResponse({ status: 200, type: AdmissionActiveDownloadListResponseDto })
  async findActive(): Promise<AdmissionActiveDownloadListResponseDto> {
    return AdmissionActiveDownloadListResponseDto.fromDomain(
      await this.getDownloads.active(),
    )
  }

  @Get(':id/file')
  @Public()
  @ApiOperation({ summary: 'Download the PDF of an active file' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'The PDF bytes as an attachment',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 404, description: 'Berkas tidak ditemukan' })
  async file(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { download, stream } = await this.getDownloadFile.execute(id)
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': String(download.sizeBytes),
      'Content-Disposition': contentDisposition(
        'attachment',
        download.fileName,
      ),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=300',
    })
    return new StreamableFile(stream)
  }
}
