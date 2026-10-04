import { Injectable, Logger } from '@nestjs/common'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { ResolveBulkImportConflictsInput } from './resolve-bulk-import-conflicts.input.js'
import { ResolveBulkImportResponseDto } from '../../../presentation/http/dto/response/resolve-bulk-import-response.dto.js'
import { UpdateStudentUseCase } from '../update-student/update-student.use-case.js'
import { UpdateStudentProfileUseCase } from '../update-student-profile/update-student-profile.use-case.js'
import { CreateStudentUseCase } from '../create-student/create-student.use-case.js'
import { EnsureStudentEnrollmentUseCase } from '../../../../enrollment/application/use-cases/ensure-student-enrollment/ensure-student-enrollment.use-case.js'
import { resolveOnceByKey } from '../../../../shared/utils/resolve-once-by-key.helper.js'
import { processBulkImportConflicts } from '../../../../shared/utils/process-bulk-import-conflicts.helper.js'

@Injectable()
export class ResolveBulkImportConflictsUseCase {
  private readonly logger = new Logger(ResolveBulkImportConflictsUseCase.name)

  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly academicLookup: IAcademicLookupPort,
    private readonly updateStudent: UpdateStudentUseCase,
    private readonly updateStudentProfile: UpdateStudentProfileUseCase,
    private readonly createStudent: CreateStudentUseCase,
    private readonly ensureStudentEnrollment: EnsureStudentEnrollmentUseCase,
  ) {}

  async execute(
    input: ResolveBulkImportConflictsInput,
  ): Promise<ResolveBulkImportResponseDto> {
    const [gradeByLevel, classroomByCode] = await Promise.all([
      resolveOnceByKey(
        input.conflicts.map((item) => item.data.grade),
        (level) => this.academicLookup.findGradeByLevel(level),
      ),
      resolveOnceByKey(
        input.conflicts.map((item) => item.data.classroomCode),
        (code) => this.academicLookup.findClassroomByCode(code),
      ),
    ])

    return processBulkImportConflicts(
      input.conflicts,
      'student',
      this.logger,
      async (item) => {
        const gradeId = item.data.grade
          ? gradeByLevel.get(item.data.grade)?.id
          : undefined
        const classroomId = item.data.classroomCode
          ? classroomByCode.get(item.data.classroomCode)?.id
          : undefined

        const existingId =
          item.existingId ??
          (
            (item.data.nis
              ? await this.studentRepository.findByNis(item.data.nis)
              : null) ??
            (item.data.nisn
              ? await this.studentRepository.findByNisn(item.data.nisn)
              : null)
          )?.id

        if (!existingId) {
          await this.createStudent.execute({
            identifier: item.data.identifier,
            password: item.data.password,
            name: item.data.name,
            nik: item.data.nik,
            gender: item.data.gender,
            birthPlace: item.data.birthPlace,
            birthDate: item.data.birthDate,
            email: item.data.email,
            phone: item.data.phone,
            gradeId,
            classroomId,
            nis: item.data.nis,
            nisn: item.data.nisn,
          })
        } else {
          await this.updateStudent.execute(existingId, {
            nis: item.data.nis,
            nisn: item.data.nisn,
            ...(gradeId && { gradeId }),
          })
          await this.updateStudentProfile.execute(existingId, {
            name: item.data.name,
            nik: item.data.nik,
            gender: item.data.gender,
            birthPlace: item.data.birthPlace,
            birthDate: item.data.birthDate,
            email: item.data.email,
            phone: item.data.phone,
          })
          if (classroomId) {
            await this.ensureStudentEnrollment.execute(existingId, classroomId)
          }
        }
      },
    )
  }
}
