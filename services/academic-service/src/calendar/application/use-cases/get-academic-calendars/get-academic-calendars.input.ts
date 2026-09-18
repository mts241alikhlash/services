import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetAcademicCalendarsInput extends PaginationQueryInput {
  academicYearId?: string
  semesterId?: string
  typeId?: string
}
