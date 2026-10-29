import { ApiProperty } from '@nestjs/swagger'
import type { PaperQuestion } from '../../../domain/policies/build-paper.policy.js'
import type { SavedAnswer } from '../../../application/use-cases/list-saved-answers/list-saved-answers.use-case.js'

const QUESTION_TYPES = [
  'MULTIPLE_CHOICE',
  'MULTIPLE_RESPONSE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'ESSAY',
] as const

export class PaperChoiceDto {
  @ApiProperty({ enum: ['A', 'B', 'C', 'D', 'E'] }) key!: string
  @ApiProperty() html!: string
}

export class PaperQuestionDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ description: 'Position on this student paper, from 1' })
  number!: number
  @ApiProperty({ enum: QUESTION_TYPES }) type!: PaperQuestion['type']
  @ApiProperty() bodyHtml!: string
  @ApiProperty() points!: number
  @ApiProperty({ type: [PaperChoiceDto], nullable: true })
  choices!: PaperChoiceDto[] | null

  static fromDomain(domain: PaperQuestion): PaperQuestionDto {
    const dto = new PaperQuestionDto()
    dto.id = domain.questionId
    dto.number = domain.number
    dto.type = domain.type
    dto.bodyHtml = domain.bodyHtml
    dto.points = domain.points
    dto.choices = domain.choices
    return dto
  }
}

export class SavedAnswerDto {
  @ApiProperty({ format: 'uuid' }) questionId!: string
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'One of { key } | { keys } | { value } | { text }',
  })
  answer!: Record<string, unknown>

  static fromDomain(domain: SavedAnswer): SavedAnswerDto {
    const dto = new SavedAnswerDto()
    dto.questionId = domain.questionId
    dto.answer = { ...domain.answer }
    return dto
  }
}
