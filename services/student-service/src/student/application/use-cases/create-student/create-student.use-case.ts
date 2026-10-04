import { Injectable, Logger } from '@nestjs/common'
import { CreateStudentInput } from './create-student.input.js'
import { StudentEntity } from '../../../domain/entities/student.entity.js'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { EnsureStudentEnrollmentUseCase } from '../../../../enrollment/application/use-cases/ensure-student-enrollment/ensure-student-enrollment.use-case.js'
import { hashPassword } from '../../../../shared/utils/hash.helper.js'
import {
  StudentCreationFailedException,
  StudentNisAlreadyExistsException,
  StudentNisnAlreadyExistsException,
} from '../../../domain/exceptions/index.js'

export type CreateStudentResult = Pick<
  StudentEntity,
  'id' | 'userId' | 'nis' | 'nisn' | 'status'
> & { gradeId?: string }

@Injectable()
export class CreateStudentUseCase {
  private readonly logger = new Logger(CreateStudentUseCase.name)

  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly ensureStudentEnrollment: EnsureStudentEnrollmentUseCase,
  ) {}

  async execute(input: CreateStudentInput): Promise<CreateStudentResult> {
    const nis = input.nis ?? ''
    const nisn = input.nisn ?? ''
    input.nis = nis
    input.nisn = nisn

    input.identifier ??= nis
      ? nis
      : input.name.toLowerCase().replace(/\s+/g, '.')
    input.password ??= nis ? nis : input.identifier

    const [dupNis, dupNisn] = await Promise.all([
      nis ? this.studentRepository.findByNis(nis) : null,
      nisn ? this.studentRepository.findByNisn(nisn) : null,
    ])
    if (dupNis) throw new StudentNisAlreadyExistsException(nis)
    if (dupNisn) throw new StudentNisnAlreadyExistsException(nisn)

    const passwordHash = await hashPassword(input.password)

    const userWithStudent = await this.studentRepository.create(
      {
        identifier: input.identifier,
        name: input.name,
        nik: input.nik,
        gender: input.gender,
        birthPlace: input.birthPlace,
        birthDate: new Date(input.birthDate),
        email: input.email,
        phone: input.phone,
        gradeId: input.gradeId,
        classroomId: input.classroomId,
        nis: input.nis,
        nisn: input.nisn,
      },
      passwordHash,
    )
    const student = userWithStudent.student
    if (!student) {
      throw new StudentCreationFailedException()
    }

    if (input.classroomId) {
      await this.ensureStudentEnrollment.execute(student.id, input.classroomId)
    }

    this.logger.log(`Student created: ${nis || input.identifier}`)
    return {
      id: student.id,
      userId: student.userId,
      nis: student.nis,
      nisn: student.nisn,
      status: student.status,
      gradeId: student.gradeId ?? undefined,
    }
  }
}
