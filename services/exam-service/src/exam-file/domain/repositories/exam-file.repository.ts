import type { ExamFile } from '../entities/exam-file.entity.js'

export type NewExamFile = Omit<ExamFile, 'createdAt'>

export abstract class IExamFileRepository {
  abstract create(input: NewExamFile): Promise<ExamFile>
  abstract findById(id: string): Promise<ExamFile | null>
}
