import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { VerifyApplicationWhenReadyUseCase } from '../../../../verification/index.js'
import {
  AdmissionStatusTransitionError,
  assertTransition,
} from '../../../../application/domain/policies/admission-status.transitions.js'
import { serializeApplicationDetail } from '../../../../application/domain/serializers/admission.serializers.js'
import { IAdmissionApplicantRepository } from '../../../domain/repositories/admission-applicant-repository.js'
import type { ApplicationWithParentsAndUser } from '../../../../application/index.js'
import { AdmissionNotificationService } from '../../../../notification/index.js'
import { admissionToday } from '../../../../wave/index.js'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import { parentGaps } from '../../../domain/policies/parent-requirements.policy.js'

const REQUIRED_FIELDS = [
  'fullName',
  'gender',
  'birthPlace',
  'birthDate',
  'nik',
  'religionId',
  'street',
  'rt',
  'rw',
  'studentResidenceId',
  'travelDistanceId',
  'travelTimeId',
  'transportationId',
  'financingSourceId',
  'previousSchoolName',
  'graduationYear',
] as const

const REGION_CODES = [
  'provinceCode',
  'regencyCode',
  'districtCode',
  'villageCode',
] as const

const REQUIRED_PARENTS = [
  { relation: 'FATHER', data: 'Data ayah', status: 'Status ayah' },
  { relation: 'MOTHER', data: 'Data ibu', status: 'Status ibu' },
] as const

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Nama lengkap',
  gender: 'Jenis kelamin',
  birthPlace: 'Tempat lahir',
  birthDate: 'Tanggal lahir',
  nik: 'NIK',
  religionId: 'Agama',
  street: 'Alamat (jalan)',
  rt: 'RT',
  rw: 'RW',
  studentResidenceId: 'Status tempat tinggal',
  travelDistanceId: 'Jarak tempat tinggal',
  travelTimeId: 'Waktu tempuh',
  transportationId: 'Transportasi',
  financingSourceId: 'Yang membiayai sekolah',
  previousSchoolName: 'Nama sekolah asal',
  graduationYear: 'Tahun lulus',
}

@Injectable()
export class SubmitApplicationUseCase {
  constructor(
    private readonly admissionApplicantRepository: IAdmissionApplicantRepository,
    private readonly notifications: AdmissionNotificationService,
    private readonly referenceLookup: IReferenceLookupPort,
    private readonly verifyWhenReady: VerifyApplicationWhenReadyUseCase,
  ) {}

  async execute(userId: string) {
    const application =
      await this.admissionApplicantRepository.findMyDetail(userId)
    if (!application) {
      throw new NotFoundException('Formulir pendaftaran tidak ditemukan')
    }
    return this.submit(application)
  }

  async executeForApplication(applicationId: string) {
    const application =
      await this.admissionApplicantRepository.findDetailById(applicationId)
    if (!application) {
      throw new NotFoundException('Formulir pendaftaran tidak ditemukan')
    }
    return this.submit(application)
  }

  private async submit(application: ApplicationWithParentsAndUser) {
    if (application.status === 'REJECTED') {
      throw new ConflictException(
        'Pendaftaran yang ditolak tidak bisa dikirim ulang',
      )
    }
    try {
      assertTransition(application.status, 'SUBMITTED')
    } catch (error) {
      if (error instanceof AdmissionStatusTransitionError) {
        throw new ConflictException(error.message)
      }
      throw error
    }

    if (!application.wave || application.wave.endDate < admissionToday()) {
      throw new ConflictException('Gelombang pendaftaran sudah ditutup')
    }

    const missing = REQUIRED_FIELDS.filter((f) => !application[f]).map(
      (f) => FIELD_LABELS[f] ?? f,
    )
    if (REGION_CODES.some((code) => !application[code])) {
      missing.push('Wilayah alamat (provinsi s.d. desa/kelurahan)')
    }
    for (const required of REQUIRED_PARENTS) {
      const parent = (application.parents ?? []).find(
        (row) => row.relation === required.relation,
      )
      if (!parent) missing.push(required.data)
      else if (!parent.lifeStatusId) missing.push(required.status)
    }
    const parents = application.parents ?? []
    const statuses = await this.referenceLookup.optionsByIds(
      'parentLifeStatuses',
      parents.flatMap((parent) =>
        parent.lifeStatusId ? [parent.lifeStatusId] : [],
      ),
    )
    missing.push(
      ...parentGaps(
        parents,
        application.nik ?? null,
        (id) => statuses.find((status) => status.id === id)?.name,
      ),
    )

    const requiredTypes =
      await this.admissionApplicantRepository.findRequiredActiveDocumentTypes()
    for (const type of requiredTypes) {
      const doc = (application.documents ?? []).find(
        (d) => d.documentTypeId === type.id,
      )
      if (!doc) {
        missing.push(`Berkas ${type.name}`)
      } else if (doc.status === 'REJECTED') {
        missing.push(`Berkas ${type.name} (ditolak, unggah ulang)`)
      }
    }

    if (missing.length > 0) {
      throw new BadRequestException(`Data belum lengkap: ${missing.join(', ')}`)
    }

    const updated = await this.admissionApplicantRepository.submitApplication(
      application.id,
    )

    await this.notifications.notify(
      application.id,
      'STATUS_CHANGE',
      'Formulir berhasil dikirim',
      'Formulir pendaftaran Anda telah kami terima dan akan diverifikasi oleh panitia. Anda akan menerima pemberitahuan setelah verifikasi selesai.',
    )

    const verified = await this.verifyWhenReady.execute(application.id, null)
    if (!verified) return serializeApplicationDetail(updated)
    const stored = await this.admissionApplicantRepository.findDetailById(
      application.id,
    )
    return serializeApplicationDetail(stored ?? updated)
  }
}
