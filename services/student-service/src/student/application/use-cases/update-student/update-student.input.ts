import { StudentStatusEnum } from '../../../../shared/domain/enums/student-status.enum.js'

export interface UpdateStudentInput {
  nis?: string
  nisn?: string
  gradeId?: string
  status?: StudentStatusEnum
}
