import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'
import { StudentStatusEnum } from '../../../../shared/domain/enums/student-status.enum.js'

export interface StudentQueryInput extends PaginationQueryInput {
  search?: string
  semesterId?: string
  classroomId?: string
  status?: StudentStatusEnum
  isActive?: boolean
}
