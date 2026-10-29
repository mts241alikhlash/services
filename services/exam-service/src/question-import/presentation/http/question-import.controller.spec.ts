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
import { CreateQuestionUseCase } from '../../../question/application/use-cases/create-question/create-question.use-case.js'
import { GetImportTemplateUseCase } from '../../application/use-cases/get-import-template/get-import-template.use-case.js'
import { ImportQuestionsUseCase } from '../../application/use-cases/import-questions/import-questions.use-case.js'
import { QuestionImportController } from './question-import.controller.js'

function build() {
  const questions = new FakeQuestionRepository()
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
        new CreateQuestionUseCase(questions, scope, employees),
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
      { ...MATH_7, packageId: 'package-1' },
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
      build().controller.import(TEACHER, undefined, {
        ...MATH_7,
        packageId: 'package-1',
      }),
    ).rejects.toThrow(BadRequestException)
  })
})
