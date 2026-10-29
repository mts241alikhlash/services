import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import {
  AddPackageQuestionDto,
  ApproveExamPackageDto,
  CreateExamPackageDto,
  RenameExamPackageDto,
  ReorderPackageQuestionsDto,
  ReturnExamPackageDto,
  TakePackageQuestionsDto,
} from './exam-package-request.dto.js'

const ID = '00000000-0000-4000-8000-000000000001'
const OTHER = '00000000-0000-4000-8000-000000000002'

function errorsFor(type: new () => object, body: Record<string, unknown>) {
  return validateSync(plainToInstance(type, body)).map(
    (error) => error.property,
  )
}

describe('exam package request DTOs', () => {
  it('create takes a title, subject and grade and no question ids', () => {
    expect(
      errorsFor(CreateExamPackageDto, {
        title: 'UTS',
        subjectId: ID,
        gradeId: OTHER,
      }),
    ).toEqual([])
    expect(errorsFor(CreateExamPackageDto, { title: 'UTS' })).toEqual([
      'subjectId',
      'gradeId',
    ])
  })

  it('rename needs a title of 1 to 200 characters', () => {
    expect(errorsFor(RenameExamPackageDto, { title: 'UAS' })).toEqual([])
    expect(errorsFor(RenameExamPackageDto, { title: '' })).toEqual(['title'])
    expect(errorsFor(RenameExamPackageDto, { title: 'x'.repeat(201) })).toEqual(
      ['title'],
    )
  })

  it('adding a question needs a type, body, content and points', () => {
    const valid = {
      type: 'TRUE_FALSE',
      bodyHtml: '<p>x</p>',
      content: { answer: { value: true } },
      points: 1,
    }
    expect(errorsFor(AddPackageQuestionDto, valid)).toEqual([])
    expect(
      errorsFor(AddPackageQuestionDto, { ...valid, type: 'ORAL' }),
    ).toEqual(['type'])
    expect(errorsFor(AddPackageQuestionDto, { ...valid, points: 0 })).toEqual([
      'points',
    ])
  })

  it('reorder takes a list of unique question ids', () => {
    expect(
      errorsFor(ReorderPackageQuestionsDto, { questionIds: [ID, OTHER] }),
    ).toEqual([])
    expect(
      errorsFor(ReorderPackageQuestionsDto, { questionIds: [ID, ID] }),
    ).toEqual(['questionIds'])
    expect(
      errorsFor(ReorderPackageQuestionsDto, { questionIds: ['x'] }),
    ).toEqual(['questionIds'])
    expect(errorsFor(ReorderPackageQuestionsDto, { questionIds: [] })).toEqual([
      'questionIds',
    ])
  })

  it('take needs a source package and at least one question', () => {
    expect(
      errorsFor(TakePackageQuestionsDto, {
        sourcePackageId: ID,
        questionIds: [OTHER],
      }),
    ).toEqual([])
    expect(
      errorsFor(TakePackageQuestionsDto, {
        sourcePackageId: 'x',
        questionIds: [],
      }),
    ).toEqual(['sourcePackageId', 'questionIds'])
  })

  it('approve may carry a note, return must', () => {
    expect(errorsFor(ApproveExamPackageDto, {})).toEqual([])
    expect(errorsFor(ApproveExamPackageDto, { note: 'Bagus' })).toEqual([])
    expect(errorsFor(ReturnExamPackageDto, { questionNotes: [] })).toEqual([
      'note',
    ])
    expect(
      errorsFor(ReturnExamPackageDto, { note: 'Perbaiki', questionNotes: [] }),
    ).toEqual([])
    expect(
      errorsFor(ReturnExamPackageDto, {
        note: 'Perbaiki',
        questionNotes: [{ questionId: 'x', note: '' }],
      }),
    ).toEqual(['questionNotes'])
  })
})
