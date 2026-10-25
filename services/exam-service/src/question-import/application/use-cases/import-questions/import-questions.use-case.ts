import { createHash } from 'node:crypto'
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
import {
  IMPORT_MAX_IMAGE_BYTES,
  IMPORT_MAX_IMAGES,
  IMPORT_MAX_BYTES,
  IMPORT_MAX_QUESTIONS,
} from '../../../domain/import-limits.js'
import type { ParseResult } from '../../../domain/parsed-question.js'
import { assertSafeArchive } from '../../parsers/archive-guard.js'
import { parseExcelQuestions } from '../../parsers/excel-question.parser.js'
import { parseWordQuestions } from '../../parsers/word-question.parser.js'
import type {
  ImportQuestionsInput,
  ImportQuestionsResult,
} from './import-questions.input.js'

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
    await assertSafeArchive(input.buffer)

    const images = this.imageSaver(user)
    const parsed = isExcel
      ? await parseExcelQuestions(input.buffer)
      : await parseWordQuestions(input.buffer, images.save)
    images.assertNoFailure()
    if (parsed.questions.length + parsed.errors.length > IMPORT_MAX_QUESTIONS) {
      throw new BadRequestException('Maksimal 500 soal per berkas')
    }

    return this.createAll(user, input, parsed)
  }

  private imageSaver(user: ScopeUser): {
    save: (content: Buffer) => Promise<string>
    assertNoFailure: () => void
  } {
    const stored = new Map<string, Promise<string>>()
    let totalBytes = 0
    let failure: Error | null = null

    const store = (content: Buffer, digest: string): Promise<string> => {
      if (stored.size >= IMPORT_MAX_IMAGES) {
        return Promise.reject(
          new BadRequestException('Maksimal 100 gambar per berkas'),
        )
      }
      totalBytes += content.length
      if (totalBytes > IMPORT_MAX_IMAGE_BYTES) {
        return Promise.reject(
          new BadRequestException('Total ukuran gambar maksimal 20 MB'),
        )
      }
      const pending = this.uploadFile
        .execute({
          buffer: content,
          size: content.length,
          originalName: 'gambar-impor',
          uploadedById: user.id,
        })
        .then((file) => file.id)
      stored.set(digest, pending)
      return pending
    }

    return {
      save: (content) => {
        const digest = createHash('sha256').update(content).digest('hex')
        return (stored.get(digest) ?? store(content, digest)).catch(
          (error: unknown) => {
            failure ??=
              error instanceof Error ? error : new Error(String(error))
            throw error
          },
        )
      },
      assertNoFailure: () => {
        if (failure !== null) throw failure
      },
    }
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
