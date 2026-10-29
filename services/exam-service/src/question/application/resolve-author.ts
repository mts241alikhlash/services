import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { IEmployeeIdentityReadPort } from '../../platform/employee-identity/employee-identity.port.js'
import type { ScopeUser } from './teacher-scope.service.js'

export async function resolveAuthor(
  employees: IEmployeeIdentityReadPort,
  user: ScopeUser,
  manageAll: boolean,
  requested: string | undefined,
): Promise<string> {
  const own = await employees.findEmployeeIdByUserId(user.id)

  if (!manageAll) {
    if (own === null) {
      throw new ForbiddenException('Akun Anda belum terhubung ke data pegawai')
    }
    if (requested !== undefined && requested !== own) {
      throw new ForbiddenException(
        'Hanya pengelola yang bisa memilih penulis soal',
      )
    }
    return own
  }

  if (requested !== undefined) {
    if (!(await employees.employeeExists(requested))) {
      throw new BadRequestException('Penulis soal tidak ditemukan')
    }
    return requested
  }
  if (own === null) throw new BadRequestException('Pilih guru penulis soal')
  return own
}
