import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import type { Response } from 'express'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import type { ScopeUser } from '../../../question/application/teacher-scope.service.js'
import { GetImportTemplateUseCase } from '../../application/use-cases/get-import-template/get-import-template.use-case.js'
import { ImportQuestionsUseCase } from '../../application/use-cases/import-questions/import-questions.use-case.js'
import { IMPORT_MAX_BYTES } from '../../domain/import-limits.js'
import {
  ImportQuestionsDto,
  ImportResultDto,
  ImportTemplateQueryDto,
} from './dto/import-questions.dto.js'

const UPLOAD_LIMITS = { fileSize: IMPORT_MAX_BYTES + 1, files: 1 }

@ApiTags('Exam Imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam-imports')
export class QuestionImportController {
  constructor(
    private readonly importQuestions: ImportQuestionsUseCase,
    private readonly getTemplate: GetImportTemplateUseCase,
  ) {}

  @Get('template')
  @RequirePermissions('exam-questions.create')
  @ApiOperation({ summary: 'Download the Excel or Word import template' })
  @ApiResponse({
    status: 200,
    description: 'The template file',
    content: {
      'application/octet-stream': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async template(
    @Query() query: ImportTemplateQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const template = await this.getTemplate.execute(query.format)
    res.set({
      'Content-Type': template.contentType,
      'Content-Length': String(template.buffer.length),
      'Content-Disposition': `attachment; filename="${template.fileName}"`,
      'X-Content-Type-Options': 'nosniff',
    })
    return new StreamableFile(template.buffer)
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('exam-questions.create')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiOperation({ summary: 'Import questions from an Excel or Word file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'packageId', 'subjectId', 'gradeId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        packageId: { type: 'string', format: 'uuid' },
        subjectId: { type: 'string', format: 'uuid' },
        gradeId: { type: 'string', format: 'uuid' },
        authorEmployeeId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 200, type: ImportResultDto })
  async import(
    @CurrentUser() user: ScopeUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: ImportQuestionsDto,
  ): Promise<ImportResultDto> {
    if (!file) throw new BadRequestException('Berkas wajib dilampirkan')
    return ImportResultDto.fromDomain(
      await this.importQuestions.execute(user, {
        buffer: file.buffer,
        size: file.size,
        fileName: file.originalname,
        packageId: dto.packageId,
        subjectId: dto.subjectId,
        gradeId: dto.gradeId,
        authorEmployeeId: dto.authorEmployeeId,
      }),
    )
  }
}
