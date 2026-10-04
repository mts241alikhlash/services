import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'

export interface CreateStudentInput {
  identifier?: string
  password?: string
  name: string
  nik: string
  gender: UserGender
  birthPlace: string
  birthDate: string
  email?: string
  phone?: string
  gradeId?: string
  classroomId?: string
  nis?: string
  nisn?: string
}
