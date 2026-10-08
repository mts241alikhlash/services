import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import { IAdmissionEnrolmentRepository } from '../../../domain/repositories/admission-enrolment.repository.js'

interface SetPlacementInput {
  applicationId: string
  admissionType: 'NEW' | 'TRANSFER'
  targetGradeId: string
}

@Injectable()
export class SetPlacementUseCase {
  constructor(
    private readonly enrolments: IAdmissionEnrolmentRepository,
    private readonly lookup: IReferenceLookupPort,
  ) {}

  async execute(input: SetPlacementInput) {
    const state = await this.enrolments.findPlacementState(input.applicationId)
    if (!state) throw new NotFoundException('Pendaftar tidak ditemukan')
    if (state.status === 'ENROLLING' || state.status === 'ENROLLED') {
      throw new ConflictException('Pendaftar sudah diproses menjadi santri')
    }
    const grade = (await this.lookup.activeGrades()).find(
      (candidate) => candidate.id === input.targetGradeId,
    )
    if (!grade) throw new BadRequestException('Tingkat kelas tidak ditemukan')

    const levelChanges =
      state.nis !== null && state.targetGradeLevel !== grade.level
    if (
      levelChanges &&
      (await this.enrolments.isNisLocked(state.academicYearId))
    ) {
      throw new ConflictException(
        'NIS sudah dikunci, tingkat kelas tidak bisa diubah',
      )
    }

    await this.enrolments.setPlacement(
      input.applicationId,
      {
        admissionType: input.admissionType,
        targetGradeId: grade.id,
        targetGradeLevel: grade.level,
      },
      levelChanges,
    )
    return {
      applicationId: input.applicationId,
      admissionType: input.admissionType,
      targetGradeId: grade.id,
      targetGradeLevel: grade.level,
      nisCleared: levelChanges,
    }
  }
}
