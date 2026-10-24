import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
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
import type { Response } from 'express'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import type { ScopeUser } from '../../../question/application/teacher-scope.service.js'
import { GetExamFileUseCase } from '../../application/use-cases/get-exam-file/get-exam-file.use-case.js'
import { UploadExamFileUseCase } from '../../application/use-cases/upload-exam-file/upload-exam-file.use-case.js'
import { EXAM_IMAGE_MAX_BYTES } from '../../domain/policies/detect-image-type.policy.js'
import { ExamFileDto } from './dto/exam-file.dto.js'

const UPLOAD_LIMITS = { fileSize: EXAM_IMAGE_MAX_BYTES + 1, files: 1 }

@ApiTags('Exam Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam-files')
export class ExamFileController {
  constructor(
    private readonly uploadFile: UploadExamFileUseCase,
    private readonly getFile: GetExamFileUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('exam-questions.create')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiOperation({ summary: 'Upload a question image (JPG, PNG or WebP, 2 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, type: ExamFileDto })
  async upload(
    @CurrentUser() user: ScopeUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ExamFileDto> {
    if (!file) throw new BadRequestException('Gambar wajib dilampirkan')
    return ExamFileDto.fromDomain(
      await this.uploadFile.execute({
        buffer: file.buffer,
        size: file.size,
        originalName: file.originalname,
        uploadedById: user.id,
      }),
    )
  }

  @Get(':id')
  @RequirePermissions('exam-questions.read')
  @ApiOperation({ summary: 'Stream a question image' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'The image bytes',
    content: {
      'image/png': { schema: { type: 'string', format: 'binary' } },
    },
  })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { file, stream } = await this.getFile.execute(id)
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.sizeBytes),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=86400',
    })
    return new StreamableFile(stream)
  }
}
