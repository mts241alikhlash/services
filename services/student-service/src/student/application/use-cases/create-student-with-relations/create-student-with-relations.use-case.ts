import { Injectable, Logger } from '@nestjs/common'
import { CreateStudentWithRelationsInput } from './create-student-with-relations.input.js'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { StudentWithDetails } from '../../../domain/repositories/student.repository.js'
import { hashPassword } from '../../../../shared/utils/hash.helper.js'
import {
  StudentNisAlreadyExistsException,
  StudentNisnAlreadyExistsException,
} from '../../../domain/exceptions/index.js'

@Injectable()
export class CreateStudentWithRelationsUseCase {
  private readonly logger = new Logger(CreateStudentWithRelationsUseCase.name)

  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(
    input: CreateStudentWithRelationsInput,
  ): Promise<StudentWithDetails> {
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
    const student = await this.studentRepository.createWithRelations(
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
        address: input.address,
        parents: input.parents?.map((p) => ({
          name: p.name,
          nik: p.nik,
          birthPlace: p.birthPlace,
          birthDate: new Date(p.birthDate),
          email: p.email,
          phone: p.phone,
          occupationId: p.occupationId,
          income: p.income,
          relation: p.relation,
          isPrimary: p.isPrimary,
        })),
      },
      passwordHash,
    )

    this.logger.log(
      `Student created with relations: ${nis || input.identifier}`,
    )
    return student
  }
}
