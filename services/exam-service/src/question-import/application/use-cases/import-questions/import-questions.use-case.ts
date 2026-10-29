import { createHash } from 'node:crypto'
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common'
import { PACKAGE_CHANGED_MESSAGE } from '../../../../exam-package/application/use-cases/add-package-question/add-package-question.use-case.js'
import type { ExamPackageDetail } from '../../../../exam-package/domain/entities/exam-package.entity.js'
import { assertEditable } from '../../../../exam-package/domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../../exam-package/domain/repositories/exam-package.repository.js'
import { UploadExamFileUseCase } from '../../../../exam-file/application/use-cases/upload-exam-file/upload-exam-file.use-case.js'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import { resolveAuthor } from '../../../../question/application/resolve-author.js'
import {
  TeacherScope,
  type ScopeUser,
} from '../../../../question/application/teacher-scope.service.js'
import { prepareQuestion } from '../../../../question/domain/policies/prepare-question.policy.js'
import { assertValidPoints } from '../../../../question/domain/policies/validate-points.policy.js'
import type { NewQuestionInput } from '../../../../question/domain/repositories/question.repository.js'
import {
  IMPORT_MAX_IMAGE_BYTES,
  IMPORT_MAX_IMAGES,
  IMPORT_MAX_BYTES,
  IMPORT_MAX_QUESTIONS,
} from '../../../domain/import-limits.js'
import type { ParseResult } from '../../../domain/parsed-question.js'
import {
  assertSafeArchive,
  normalizeArchive,
} from '../../parsers/archive-guard.js'
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
    private readonly packages: IExamPackageRepository,
    private readonly employees: IEmployeeIdentityReadPort,
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

    const pkg = await this.packages.findById(input.packageId)
    if (pkg === null) throw new NotFoundException('Paket tidak ditemukan')
    const scope = await this.scope.forUser(user)
    this.scope.assertCovers(scope, pkg.subjectId, pkg.gradeId)
    const next = assertEditable(pkg.status)

    const images = this.imageSaver(user)
    let parsed: ParseResult
    if (isExcel) {
      parsed = await parseExcelQuestions(await normalizeArchive(input.buffer))
    } else {
      await assertSafeArchive(input.buffer)
      parsed = await parseWordQuestions(input.buffer, images.save)
    }
    images.assertNoFailure()
    if (parsed.questions.length + parsed.errors.length > IMPORT_MAX_QUESTIONS) {
      throw new BadRequestException('Maksimal 500 soal per berkas')
    }

    return this.createAll(user, input, pkg, next, scope.all, parsed)
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
    pkg: ExamPackageDetail,
    next: ExamPackageDetail['status'],
    manageAll: boolean,
    parsed: ParseResult,
  ): Promise<ImportQuestionsResult> {
    const errors = [...parsed.errors]
    const authorEmployeeId = await resolveAuthor(
      this.employees,
      user,
      manageAll,
      input.authorEmployeeId,
    )

    const good: NewQuestionInput[] = []
    for (const question of parsed.questions) {
      try {
        assertValidPoints(question.points)
        const { bodyHtml, content } = prepareQuestion(
          question.type,
          question.bodyHtml,
          question.content,
        )
        good.push({
          packageId: pkg.id,
          subjectId: pkg.subjectId,
          gradeId: pkg.gradeId,
          authorEmployeeId,
          type: question.type,
          createdById: user.id,
          bodyHtml,
          content,
          points: question.points,
        })
      } catch (error) {
        if (!(error instanceof HttpException)) throw error
        errors.push({ row: question.row, reason: error.message })
      }
    }

    let questionIds: string[] = []
    if (good.length > 0) {
      const updated = await this.packages.addQuestions(
        pkg.id,
        { expected: pkg.status, next },
        good,
      )
      if (updated === null) throw new ConflictException(PACKAGE_CHANGED_MESSAGE)
      questionIds = updated.items
        .slice(updated.items.length - good.length)
        .map((item) => item.questionId)
    }

    return {
      created: questionIds.length,
      questionIds,
      errors: errors.sort((a, b) => a.row - b.row),
    }
  }
}
