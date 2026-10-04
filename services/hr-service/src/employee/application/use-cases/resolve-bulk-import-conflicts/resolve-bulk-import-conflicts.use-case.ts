import { Injectable, Logger } from '@nestjs/common'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { ResolveBulkImportConflictsInput } from './resolve-bulk-import-conflicts.input.js'
import { ResolveBulkImportResponseDto } from '../../../presentation/http/dto/response/resolve-bulk-import-response.dto.js'
import { UpdateEmployeeUseCase } from '../update-employee/update-employee.use-case.js'
import { UpdateEmployeeProfileUseCase } from '../update-employee-profile/update-employee-profile.use-case.js'
import { CreateEmployeeUseCase } from '../create-employee/create-employee.use-case.js'
import { resolveOnceByKey } from '../../../../shared/utils/resolve-once-by-key.helper.js'
import { processBulkImportConflicts } from '../../../../shared/utils/process-bulk-import-conflicts.helper.js'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'

@Injectable()
export class ResolveBulkImportConflictsUseCase {
  private readonly logger = new Logger(ResolveBulkImportConflictsUseCase.name)

  constructor(
    private readonly employeeRepository: IEmployeeRepository,
    private readonly updateEmployee: UpdateEmployeeUseCase,
    private readonly updateEmployeeProfile: UpdateEmployeeProfileUseCase,
    private readonly createEmployee: CreateEmployeeUseCase,
  ) {}

  async execute(
    dto: ResolveBulkImportConflictsInput,
  ): Promise<ResolveBulkImportResponseDto> {
    const employmentTypeIdByCode = await resolveOnceByKey(
      dto.conflicts.map((item) => item.data.employmentTypeCode),
      (code) => this.employeeRepository.resolveEmploymentTypeId(code),
    )

    return processBulkImportConflicts(
      dto.conflicts,
      'employee',
      this.logger,
      async (item) => {
        const employmentTypeId = employmentTypeIdByCode.get(
          item.data.employmentTypeCode,
        )!

        const existingId = item.existingId ?? (await this.resolveId(item.data))

        if (!existingId) {
          await this.createEmployee.execute({
            ...item.data,
            gender: item.data.gender as UserGender,
            employmentTypeId,
          })
        } else {
          await this.updateEmployee.execute(existingId, {
            nip: item.data.nip,
            nuptk: item.data.nuptk,
            employmentTypeId,
          })
          await this.updateEmployeeProfile.execute(existingId, {
            name: item.data.name,
            nik: item.data.nik,
            gender: item.data.gender as UserGender,
            birthPlace: item.data.birthPlace,
            birthDate: item.data.birthDate,
            email: item.data.email,
            phone: item.data.phone,
          })
        }
      },
    )
  }

  private async resolveId(data: {
    nip?: string
    nuptk?: string
    nik?: string
  }): Promise<string | undefined> {
    if (data.nip) {
      const byNip = await this.employeeRepository.findByNip(data.nip)
      if (byNip) return byNip.id
    }
    if (data.nuptk) {
      const byNuptk = await this.employeeRepository.findByNuptk(data.nuptk)
      if (byNuptk) return byNuptk.id
    }
    if (data.nik) {
      const profile = await this.employeeRepository.findProfileByNik(data.nik)
      if (profile) {
        const employee = await this.employeeRepository.findByUserId(
          profile.userId,
        )
        if (employee) return employee.id
      }
    }
    return undefined
  }
}
