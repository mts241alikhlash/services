import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import type { Response } from 'express'
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { GetAdmissionFileUseCase } from '../../application/use-cases/get-admission-file/get-admission-file.use-case.js'
import { contentDisposition } from './content-disposition.js'

@ApiTags('Admission — Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/files')
export class AdmissionFileController {
  constructor(private readonly getFile: GetAdmissionFileUseCase) {}

  @Get(':fileId')
  @RequirePermissions('admissions.read')
  @ApiOperation({
    summary:
      'Stream a file an admission record owns (document, proof, attachment)',
  })
  @ApiParam({ name: 'fileId', format: 'uuid' })
  @ApiQuery({
    name: 'download',
    required: false,
    description: '1 downloads the file instead of showing it inline',
  })
  @ApiResponse({
    status: 200,
    description: 'The file bytes with their stored content type',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiResponse({ status: 404, description: 'Berkas tidak ditemukan' })
  async stream(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { file, stream } = await this.getFile.execute(fileId)
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': contentDisposition(
        download === '1' ? 'attachment' : 'inline',
        file.originalName,
      ),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=300',
    })
    return new StreamableFile(stream)
  }
}
