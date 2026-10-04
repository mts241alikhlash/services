import { IProfileLookupPort } from '../../platform/profile-lookup/profile-lookup.port.js'
import { IStudentLookupPort } from '../../platform/student-lookup/student-lookup.port.js'
import { IEmployeeLookupPort } from '../../platform/employee-lookup/employee-lookup.port.js'
import { UserRef } from '../domain/entities/reference.entity.js'
import { resolveUserRefs } from './resolve-user-refs.helper.js'

export interface EmployeePersonRef {
  id: string
  userId: string
  nip: string | null
  user?: UserRef
}

export interface StudentPersonRef {
  id: string
  userId: string
  nis: string
  user?: UserRef
}

export async function resolveEmployeeRefs(
  employeeIds: string[],
  employeeLookup: IEmployeeLookupPort,
  profileLookupPort: IProfileLookupPort,
): Promise<Map<string, EmployeePersonRef>> {
  if (employeeIds.length === 0) return new Map()

  const employees = await employeeLookup.listByIds(employeeIds)
  const userRefs = await resolveUserRefs(
    employees.map((employee) => employee.userId),
    profileLookupPort,
  )

  return new Map(
    employees.map((employee) => [
      employee.id,
      {
        id: employee.id,
        userId: employee.userId,
        nip: employee.nip,
        user: userRefs.get(employee.userId),
      },
    ]),
  )
}

export async function resolveStudentRefs(
  studentIds: string[],
  studentLookup: IStudentLookupPort,
  profileLookupPort: IProfileLookupPort,
): Promise<Map<string, StudentPersonRef>> {
  if (studentIds.length === 0) return new Map()

  const students = await studentLookup.listByIds(studentIds)
  const userRefs = await resolveUserRefs(
    students.map((student) => student.userId),
    profileLookupPort,
  )

  return new Map(
    students.map((student) => [
      student.id,
      {
        id: student.id,
        userId: student.userId,
        nis: student.nis,
        user: userRefs.get(student.userId),
      },
    ]),
  )
}
