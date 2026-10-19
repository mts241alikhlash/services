import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { IAccountProvisioningPort } from '../../../../platform/user/index.js'
import { EnrollExistingAccountInput } from './enroll-existing-account.input.js'

@Injectable()
export class EnrollExistingAccountUseCase {
  private readonly logger = new Logger(EnrollExistingAccountUseCase.name)

  constructor(
    private readonly students: IStudentRepository,
    private readonly accountProvisioning: IAccountProvisioningPort,
  ) {}

  async execute(input: EnrollExistingAccountInput) {
    const already = await this.students.findByUserId(input.userId)
    if (already) {
      this.logger.log(
        `Account ${input.userId} is already student ${already.id} — returned unchanged`,
      )
      return {
        studentId: already.id,
        parentsLinked: 0,
        enrollmentCreated: false,
        alreadyEnrolled: true,
      }
    }

    const [nisTaken, nisnTaken] = await Promise.all([
      this.students.findByNis(input.nis),
      this.students.findByNisn(input.nisn),
    ])
    if (nisTaken) {
      throw new ConflictException(`NIS ${input.nis} is already in use`)
    }
    if (nisnTaken) {
      throw new ConflictException(`NISN ${input.nisn} is already in use`)
    }

    await this.accountProvisioning.updateProfile(input.userId, {
      name: input.profile.name,
      nik: input.profile.nik,
      gender: input.profile.gender,
      birthPlace: input.profile.birthPlace,
      birthDate: new Date(input.profile.birthDate),
      email: input.profile.email ?? undefined,
      phone: input.profile.phone ?? undefined,
    })
    await this.accountProvisioning.assignRole(input.userId, 'STUDENT')

    const result = await this.students.enrollExistingAccount({
      applicationId: input.applicationId,
      userId: input.userId,
      nis: input.nis,
      nisn: input.nisn,
      gradeId: input.gradeId,
      classroomId: input.classroomId,
      parents: input.parents?.map((parent) => ({
        ...parent,
        birthDate: new Date(parent.birthDate),
      })),
      address: input.address,
    })

    this.logger.log(
      `Account ${input.userId} enrolled as student ${result.studentId} (NIS ${input.nis})`,
    )

    return result
  }
}
