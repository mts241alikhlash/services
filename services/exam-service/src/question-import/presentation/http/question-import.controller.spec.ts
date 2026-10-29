import { BadRequestException, StreamableFile } from '@nestjs/common'
import type { Response } from 'express'
import {
  FakeExamFileRepository,
  FakeExamFileStorage,
} from '../../../exam-file/application/exam-file.fakes.fake.js'
import { UploadExamFileUseCase } from '../../../exam-file/application/use-cases/upload-exam-file/upload-exam-file.use-case.js'
import {
  FakeQuestionRepository,
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../../question/application/question.repository.fake.js'
import { GetImportTemplateUseCase } from '../../application/use-cases/get-import-template/get-import-template.use-case.js'
import { ImportQuestionsUseCase } from '../../application/use-cases/import-questions/import-questions.use-case.js'
import { FakeExamPackageRepository } from '../../../exam-package/application/exam-package.repository.fake.js'
import { QuestionImportController } from './question-import.controller.js'

const PACKAGE_ID = '33333333-3333-4333-8333-333333333333'

function build() {
  const questions = new FakeQuestionRepository()
  const packages = new FakeExamPackageRepository(questions)
  const now = new Date()
  packages.packages.set(PACKAGE_ID, {
    id: PACKAGE_ID,
    title: 'UTS Matematika',
    ...MATH_7,
    status: 'DRAFT',
    lockedAt: null,
    createdById: TEACHER.id,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    items: [],
  })
  const { scope, employees } = buildTeacherScope({
    employeeId: 'emp-1',
    pairs: [MATH_7],
  })
  const template = new GetImportTemplateUseCase()
  return {
    template,
    controller: new QuestionImportController(
      new ImportQuestionsUseCase(
        scope,
        packages,
        employees,
        new UploadExamFileUseCase(
          new FakeExamFileRepository(),
          new FakeExamFileStorage(),
        ),
      ),
      template,
    ),
  }
}

describe('QuestionImportController', () => {
  it('serves the template as an attachment and imports it back', async () => {
    const { controller, template } = build()
    const set = jest.fn()

    const streamed = await controller.template({ format: 'xlsx' }, {
      set,
    } as unknown as Response)
    const { buffer } = await template.execute('xlsx')
    const result = await controller.import(
      TEACHER,
      {
        buffer,
        size: buffer.length,
        originalname: 'template-soal.xlsx',
      } as Express.Multer.File,
      { packageId: PACKAGE_ID },
    )

    expect(streamed).toBeInstanceOf(StreamableFile)
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Disposition': 'attachment; filename="template-soal.xlsx"',
      }),
    )
    expect(result).toMatchObject({ created: 5, errors: [] })
    expect(result.questionIds).toHaveLength(5)
  })

  it('refuses a request with no file', async () => {
    await expect(
      build().controller.import(TEACHER, undefined, { packageId: PACKAGE_ID }),
    ).rejects.toThrow(BadRequestException)
  })
})
