import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common'
import { UploadExamFileUseCase } from '../../../../exam-file/application/use-cases/upload-exam-file/upload-exam-file.use-case.js'
import {
  TeacherScope,
  type ScopeUser,
} from '../../../../question/application/teacher-scope.service.js'
import { CreateQuestionUseCase } from '../../../../question/application/use-cases/create-question/create-question.use-case.js'
import type { ParseResult } from '../../../domain/parsed-question.js'
import { parseExcelQuestions } from '../../parsers/excel-question.parser.js'
import { parseWordQuestions } from '../../parsers/word-question.parser.js'
import type {
  ImportQuestionsInput,
  ImportQuestionsResult,
} from './import-questions.input.js'

export const IMPORT_MAX_BYTES = 10 * 1024 * 1024
export const IMPORT_MAX_QUESTIONS = 500

const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]

@Injectable()
export class ImportQuestionsUseCase {
  constructor(
    private readonly scope: TeacherScope,
    private readonly createQuestion: CreateQuestionUseCase,
    private readonly uploadFile: UploadExamFileUseCase,
  ) {}

  async execute(
    user: ScopeUser,
    input: ImportQuestionsInput,
  ): Promise<ImportQuestionsResult> {
    if (input.size > IMPORT_MAX_BYTES) {
      throw new PayloadTooLargeException('Ukuran berkas maksimal 10 MB')
    }
    const name = input.fileName.toLowerCase()
    const isExcel = name.endsWith('.xlsx')
    if (!isExcel && !name.endsWith('.docx')) {
      throw new BadRequestException('Berkas harus .xlsx atau .docx')
    }
    if (!ZIP_SIGNATURE.every((byte, index) => input.buffer[index] === byte)) {
      throw new BadRequestException('Isi berkas tidak sesuai dengan jenisnya')
    }

    this.scope.assertCovers(
      await this.scope.forUser(user),
      input.subjectId,
      input.gradeId,
    )

    const parsed = isExcel
      ? await parseExcelQuestions(input.buffer)
      : await parseWordQuestions(input.buffer, (content) =>
          this.saveImage(user, content),
        )
    if (parsed.questions.length + parsed.errors.length > IMPORT_MAX_QUESTIONS) {
      throw new BadRequestException('Maksimal 500 soal per berkas')
    }

    return this.createAll(user, input, parsed)
  }

  private async saveImage(user: ScopeUser, content: Buffer): Promise<string> {
    const file = await this.uploadFile.execute({
      buffer: content,
      size: content.length,
      originalName: 'gambar-impor',
      uploadedById: user.id,
    })
    return file.id
  }

  private async createAll(
    user: ScopeUser,
    input: ImportQuestionsInput,
    parsed: ParseResult,
  ): Promise<ImportQuestionsResult> {
    const questionIds: string[] = []
    const errors = [...parsed.errors]

    for (const question of parsed.questions) {
      try {
        const created = await this.createQuestion.execute(user, {
          subjectId: input.subjectId,
          gradeId: input.gradeId,
          authorEmployeeId: input.authorEmployeeId,
          type: question.type,
          bodyHtml: question.bodyHtml,
          content: question.content,
          points: question.points,
        })
        questionIds.push(created.id)
      } catch (error) {
        if (!(error instanceof HttpException)) throw error
        if (error instanceof ForbiddenException) throw error
        errors.push({ row: question.row, reason: error.message })
      }
    }

    return {
      created: questionIds.length,
      questionIds,
      errors: errors.sort((a, b) => a.row - b.row),
    }
  }
}
