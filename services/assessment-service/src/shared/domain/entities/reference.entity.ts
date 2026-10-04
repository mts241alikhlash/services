import { UserGender } from '../enums/user-gender.enum.js'

export interface ProfileNameRef {
  name: string
}

export interface ProfileDisplayRef extends ProfileNameRef {
  avatarFile?: { storageKey: string } | null
}

export interface ProfileRosterRef extends ProfileNameRef {
  nik: string
  gender: `${UserGender}`
}

export interface UserRef<TProfile = ProfileNameRef> {
  id: string
  identifier: string
  isActive: boolean
  profile?: TProfile | null
}

export interface PersonRef<TProfile = ProfileNameRef> {
  id: string
  userId: string
  user?: UserRef<TProfile>
}

export interface GradeRef {
  id: string
  level: number
  name: string
  isActive: boolean
  deletedAt: Date | null
}

export interface AcademicYearRef {
  id: string
  name: string
  isActive: boolean
  deletedAt: Date | null
}

export interface SemesterRef {
  id: string
  academicYearId: string
  typeId: string
  startDate: Date | null
  endDate: Date | null
  isActive: boolean
  deletedAt: Date | null
  academicYear?: AcademicYearRef
}

export interface ClassroomRef {
  id: string
  code: string
  name: string | null
  gradeId: string
  academicYearId: string
  capacity: number
  grade?: GradeRef
}

export interface SubjectRef {
  id: string
  code: string | null
  name: string
}

export interface NamedRef {
  id: string
  name: string
}

export interface CodedRef extends NamedRef {
  code: string
}
