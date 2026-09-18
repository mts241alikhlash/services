import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  assertTransition,
  AdmissionStatusTransitionError,
} from '../../../domain/policies/admission-status.transitions.js'
import {
  hasCompleteAddress,
  isEligibleAdmissionParent,
} from '../../../domain/policies/enroll-as-student.rules.js'
import { IAdmissionApplicationRepository } from '../../../domain/repositories/admission-application-repository.js'
import { AdmissionNotificationService } from '../../../../notification/index.js'
import { IStudentEnrolmentPort } from '../../../infrastructure/integration/student-enrolment.port.js'
import type { EnrollApplicantInput } from './enroll-applicant.input.js'

@Injectable()
export class EnrollApplicantUseCase {
  private readonly logger = new Logger(EnrollApplicantUseCase.name)

  constructor(
    private readonly admissionApplicationRepository: IAdmissionApplicationRepository,
    private readonly notifications: AdmissionNotificationService,
    private readonly enrolment: IStudentEnrolmentPort,
  ) {}

  async execute(
    applicationId: string,
    dto: EnrollApplicantInput,
    bearerToken: string,
  ) {
    const application =
      await this.admissionApplicationRepository.findActiveWithParentsAndUser(
        applicationId,
      )
    if (!application) {
      throw new NotFoundException('Application not found')
    }

    try {
      assertTransition(application.status, 'ENROLLING')
    } catch (error) {
      if (error instanceof AdmissionStatusTransitionError) {
        throw new ConflictException(error.message)
      }
      throw error
    }

    if (
      !application.gender ||
      !application.birthPlace ||
      !application.birthDate
    ) {
      throw new BadRequestException(
        'Applicant profile is incomplete (gender, place and date of birth)',
      )
    }
    if (!application.nik) {
      throw new BadRequestException(
        'A national ID is required before the applicant can be processed',
      )
    }

    if (application.status === 'ACCEPTED') {
      await this.admissionApplicationRepository.setEnrolling(application.id)
    }

    const enrolled = await this.enrolment.enrol(
      {
        applicationId: application.id,
        userId: application.userId,
        nis: dto.nis,
        nisn: dto.nisn,
        gradeId: dto.gradeId,
        classroomId: dto.classroomId,
        profile: {
          name: application.fullName ?? '',
          nik: application.nik,
          gender: application.gender,
          birthPlace: application.birthPlace,
          birthDate: application.birthDate.toISOString(),
          email: application.email,
          phone: application.phone,
          religionId: application.religionId,
        },
        parents: (application.parents ?? [])
          .filter(isEligibleAdmissionParent)
          .map((parent) => ({
            name: parent.name,
            nik: parent.nik,
            birthPlace: parent.birthPlace,
            birthDate: parent.birthDate.toISOString(),
            phone: parent.phone,
            occupationId: parent.occupationId,
            income: parent.income,
            relation: parent.relation,
            isPrimary: parent.isPrimary ?? false,
          })),
        address: hasCompleteAddress(application)
          ? {
              street: application.street,
              rt: application.rt,
              rw: application.rw,
              village: application.village,
              district: application.district,
              city: application.city,
              province: application.province,
              postalCode: application.postalCode!,
            }
          : undefined,
      },
      bearerToken,
    )

    const result = await this.admissionApplicationRepository.markEnrolled(
      application.id,
      enrolled.studentId,
    )

    await this.notifications.notify(
      application.id,
      'STATUS_CHANGE',
      'Selamat datang, santri baru!',
      `Anda telah resmi terdaftar sebagai santri dengan NIS ${dto.nis}. Akun ini sekarang dapat digunakan untuk masuk ke aplikasi akademik.`,
    )

    this.logger.log(
      `Applicant ${application.registrationNumber} enrolled as student ${enrolled.studentId} (NIS ${dto.nis})`,
    )

    return {
      ...result,
      student: {
        id: enrolled.studentId,
        parentsLinked: enrolled.parentsLinked,
        enrollmentCreated: enrolled.enrollmentCreated,
        alreadyEnrolled: enrolled.alreadyEnrolled,
      },
    }
  }
}
