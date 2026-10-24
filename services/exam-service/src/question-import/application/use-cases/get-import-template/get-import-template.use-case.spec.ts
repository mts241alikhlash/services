import { prepareQuestion } from '../../../../question/domain/policies/prepare-question.policy.js'
import { parseExcelQuestions } from '../../parsers/excel-question.parser.js'
import { parseWordQuestions } from '../../parsers/word-question.parser.js'
import { GetImportTemplateUseCase } from './get-import-template.use-case.js'

describe('GetImportTemplateUseCase', () => {
  it('gives an Excel template whose examples all import cleanly', async () => {
    const template = await new GetImportTemplateUseCase().execute('xlsx')

    const parsed = await parseExcelQuestions(template.buffer)

    expect(template.fileName).toBe('template-soal.xlsx')
    expect(template.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    expect(parsed.errors).toEqual([])
    expect(parsed.questions.map((q) => q.type)).toEqual([
      'MULTIPLE_CHOICE',
      'MULTIPLE_RESPONSE',
      'TRUE_FALSE',
      'SHORT_ANSWER',
      'ESSAY',
    ])
    for (const question of parsed.questions) {
      expect(() =>
        prepareQuestion(question.type, question.bodyHtml, question.content),
      ).not.toThrow()
    }
  })

  it('gives a Word template whose examples all import cleanly', async () => {
    const template = await new GetImportTemplateUseCase().execute('docx')

    const parsed = await parseWordQuestions(template.buffer, () =>
      Promise.resolve('unused'),
    )

    expect(template.fileName).toBe('template-soal.docx')
    expect(template.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    expect(parsed.errors).toEqual([])
    expect(parsed.questions.map((q) => q.type)).toEqual([
      'MULTIPLE_CHOICE',
      'MULTIPLE_RESPONSE',
      'TRUE_FALSE',
      'SHORT_ANSWER',
      'ESSAY',
    ])
    for (const question of parsed.questions) {
      expect(() =>
        prepareQuestion(question.type, question.bodyHtml, question.content),
      ).not.toThrow()
    }
  })
})
