import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { isEditable } from '../../../../application/domain/policies/admission-status.transitions.js'
import type { ApplicationWithParentsAndUser } from '../../../../application/index.js'
import { serializeApplicationDetail } from '../../../../application/domain/serializers/admission.serializers.js'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import { IRegionLookupPort } from '../../../../../platform/region-lookup/region-lookup.port.js'
import {
  AdmissionAchievementInput,
  AdmissionApplicationParentInput,
  AdmissionScholarshipInput,
  IAdmissionApplicantRepository,
  UpdateMyApplicationFields,
} from '../../../domain/repositories/admission-applicant-repository.js'
import {
  assertOptionChecks,
  type OptionCheck,
  type OptionChoices,
} from '../../../domain/policies/assert-options.policy.js'
import {
  resolveRegion,
  type RegionCodes,
  type ResolvedRegion,
} from '../../../domain/policies/resolve-region.policy.js'
import { settleGuardian } from '../../../domain/policies/settle-guardian.policy.js'
import type { UpdateMyApplicationInput } from './update-my-application.input.js'

const KIP_CATEGORY = 'KIP/PIP'

const REGION_CODE_FIELDS = [
  'provinceCode',
  'regencyCode',
  'districtCode',
  'villageCode',
] as const

type ParentRow = NonNullable<ApplicationWithParentsAndUser['parents']>[number]

function studentChoices(
  source: UpdateMyApplicationFields | ApplicationWithParentsAndUser,
): OptionChoices {
  return {
    financingSources: source.financingSourceId,
    disabilityTypes: source.disabilityTypeId,
    specialNeeds: source.specialNeedId,
    studentResidences: source.studentResidenceId,
    travelDistances: source.travelDistanceId,
    travelTimes: source.travelTimeId,
    transportations: source.transportationId,
  }
}

function parentChoices(
  source: AdmissionApplicationParentInput | ParentRow | undefined,
): OptionChoices {
  return {
    occupations: source?.occupationId,
    educations: source?.educationId,
    incomeRanges: source?.incomeRangeId,
    parentLifeStatuses: source?.lifeStatusId,
    domiciles: source?.domicileId,
    parentResidences: source?.residenceId,
  }
}

function codesOf(source: RegionCodes): string[] {
  return REGION_CODE_FIELDS.map((field) => source[field]).filter(
    (code): code is string => Boolean(code),
  )
}

@Injectable()
export class UpdateMyApplicationUseCase {
  constructor(
    private readonly admissionApplicantRepository: IAdmissionApplicantRepository,
    private readonly referenceLookup: IReferenceLookupPort,
    private readonly regionLookup: IRegionLookupPort,
  ) {}

  async execute(userId: string, input: UpdateMyApplicationInput) {
    const application =
      await this.admissionApplicantRepository.findMyDetail(userId)
    if (!application) {
      throw new NotFoundException('Formulir pendaftaran tidak ditemukan')
    }
    return this.update(application, input)
  }

  async executeForApplication(
    applicationId: string,
    input: UpdateMyApplicationInput,
  ) {
    const application =
      await this.admissionApplicantRepository.findDetailById(applicationId)
    if (!application) {
      throw new NotFoundException('Formulir pendaftaran tidak ditemukan')
    }
    return this.update(application, input)
  }

  private async update(
    application: ApplicationWithParentsAndUser,
    input: UpdateMyApplicationInput,
  ) {
    if (!isEditable(application.status)) {
      throw new ConflictException(
        'Formulir hanya bisa diubah saat masih draf atau diminta revisi',
      )
    }

    const { achievements, scholarships, ...rest } = input
    const { parents: requestedParents, ...fields } = rest
    const parents = requestedParents && settleGuardian(requestedParents)
    await assertOptionChecks(
      [
        ...this.choiceChecks(application, fields, parents),
        ...this.rowChecks(application, achievements, scholarships),
      ],
      this.referenceLookup,
    )
    await this.assertFiles(application, achievements, scholarships)
    const settledScholarships = await this.settleKip(scholarships)
    const { data, parentInputs, sharedAddress } = await this.resolveAddresses(
      application,
      fields,
      parents,
    )

    const updated = await this.admissionApplicantRepository.updateMyApplication(
      {
        applicationId: application.id,
        data,
        parents: parentInputs,
        achievements,
        scholarships: settledScholarships,
        sharedAddress,
      },
    )

    return serializeApplicationDetail(updated)
  }

  private choiceChecks(
    application: ApplicationWithParentsAndUser,
    fields: UpdateMyApplicationFields,
    parents: AdmissionApplicationParentInput[] | undefined,
  ): OptionCheck[] {
    return [
      {
        chosen: studentChoices(fields),
        previous: studentChoices(application),
      },
      ...(parents ?? []).map((parent) => ({
        chosen: parentChoices(parent),
        previous: parentChoices(
          application.parents?.find(
            (row) => String(row.relation) === String(parent.relation),
          ),
        ),
      })),
    ]
  }

  private rowChecks(
    application: ApplicationWithParentsAndUser,
    achievements: AdmissionAchievementInput[] | undefined,
    scholarships: AdmissionScholarshipInput[] | undefined,
  ): OptionCheck[] {
    const held = <T>(rows: T[] | undefined, field: keyof T, id: unknown) =>
      rows?.some((row) => row[field] === id) ? (id as string) : null

    return [
      ...(achievements ?? []).map((row) => ({
        chosen: {
          competitionFields: row.competitionFieldId,
          competitionLevels: row.competitionLevelId,
        },
        previous: {
          competitionFields: held(
            application.achievements,
            'competitionFieldId',
            row.competitionFieldId,
          ),
          competitionLevels: held(
            application.achievements,
            'competitionLevelId',
            row.competitionLevelId,
          ),
        },
      })),
      ...(scholarships ?? []).map((row) => ({
        chosen: {
          scholarshipCategories: row.categoryId,
          scholarshipProviderTypes: row.providerTypeId,
        },
        previous: {
          scholarshipCategories: held(
            application.scholarships,
            'categoryId',
            row.categoryId,
          ),
          scholarshipProviderTypes: held(
            application.scholarships,
            'providerTypeId',
            row.providerTypeId,
          ),
        },
      })),
    ]
  }

  private async settleKip(
    scholarships: AdmissionScholarshipInput[] | undefined,
  ) {
    if (!scholarships?.length) return scholarships
    const categories = await this.referenceLookup.optionsByIds(
      'scholarshipCategories',
      scholarships.flatMap((row) => (row.categoryId ? [row.categoryId] : [])),
    )
    return scholarships.map((row) => {
      const isKip =
        categories.find((category) => category.id === row.categoryId)?.name ===
        KIP_CATEGORY
      const kipNumber = row.kipNumber?.trim()
      if (isKip && !kipNumber) {
        throw new BadRequestException(
          'No. KIP wajib diisi untuk beasiswa KIP/PIP',
        )
      }
      return { ...row, kipNumber: isKip ? kipNumber : null }
    })
  }

  private async assertFiles(
    application: ApplicationWithParentsAndUser,
    achievements: AdmissionAchievementInput[] | undefined,
    scholarships: AdmissionScholarshipInput[] | undefined,
  ) {
    const fileIds = [
      ...new Set(
        [...(achievements ?? []), ...(scholarships ?? [])]
          .map((row) => row.fileId)
          .filter((id): id is string => Boolean(id)),
      ),
    ]
    if (
      fileIds.length > 0 &&
      (await this.admissionApplicantRepository.countApplicationFiles(
        application.id,
        fileIds,
      )) !== fileIds.length
    ) {
      throw new BadRequestException('Lampiran tidak ditemukan')
    }
  }

  private async resolveAddresses(
    application: ApplicationWithParentsAndUser,
    fields: UpdateMyApplicationFields,
    parents: AdmissionApplicationParentInput[] | undefined,
  ) {
    const ownParents = (parents ?? []).filter(
      (parent) => parent.sameAddressAsStudent === false,
    )
    const touchesRegion = REGION_CODE_FIELDS.some((field) => fields[field])
    if (!touchesRegion) {
      for (const field of REGION_CODE_FIELDS) delete fields[field]
    }
    const wanted = [
      ...(touchesRegion ? codesOf(fields) : []),
      ...ownParents.flatMap((parent) => codesOf(parent)),
    ]
    const found = wanted.length ? await this.regionLookup.byCodes(wanted) : []

    const studentRegion = touchesRegion ? resolveRegion(fields, found) : null
    const data: UpdateMyApplicationFields = { ...fields, ...studentRegion }

    const sharedAddress = {
      street: fields.street ?? application.street ?? null,
      rt: fields.rt ?? application.rt ?? null,
      rw: fields.rw ?? application.rw ?? null,
      postalCode: fields.postalCode ?? application.postalCode ?? null,
      ...(studentRegion ?? storedRegion(application)),
    }

    const parentInputs = parents?.map((parent) => {
      if (parent.sameAddressAsStudent === false) {
        return {
          ...parent,
          street: parent.street ?? null,
          rt: parent.rt ?? null,
          rw: parent.rw ?? null,
          postalCode: parent.postalCode ?? null,
          ...resolveRegion(parent, found),
        }
      }
      return { ...parent, sameAddressAsStudent: true, ...sharedAddress }
    })

    const addressTouched =
      touchesRegion ||
      [fields.street, fields.rt, fields.rw, fields.postalCode].some(
        (value) => value !== undefined,
      )

    return {
      data,
      parentInputs,
      sharedAddress:
        parents === undefined && addressTouched ? sharedAddress : undefined,
    }
  }
}

function storedRegion(
  application: ApplicationWithParentsAndUser,
): ResolvedRegion {
  return {
    provinceCode: application.provinceCode ?? null,
    regencyCode: application.regencyCode ?? null,
    districtCode: application.districtCode ?? null,
    villageCode: application.villageCode ?? null,
    province: application.province ?? null,
    city: application.city ?? null,
    district: application.district ?? null,
    village: application.village ?? null,
  }
}
