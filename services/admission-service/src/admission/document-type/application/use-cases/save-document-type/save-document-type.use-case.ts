import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  IAdmissionDocumentTypeRepository,
  type CreateDocumentTypeInput,
  type UpdateDocumentTypeInput,
} from '../../../domain/repositories/admission-document-type-repository.js'
import type { DocumentRequirement } from '../../../domain/entities/admission-document-type.entity.js'
import { documentTypeCode } from '../../../domain/policies/document-type-code.policy.js'

const LIMIT_REQUIRED = 'Batas berkas susulan wajib diisi 1 sampai 12 bulan'

function requirementOf(input: {
  requirement?: DocumentRequirement
  isRequired?: boolean
}): DocumentRequirement | undefined {
  if (input.requirement !== undefined) return input.requirement
  if (input.isRequired === undefined) return undefined
  return input.isRequired ? 'REQUIRED' : 'OPTIONAL'
}

function limitFor(
  requirement: DocumentRequirement,
  months: number | null,
): number | null {
  if (requirement !== 'LATER') {
    if (months !== null) {
      throw new BadRequestException('Batas hanya berlaku untuk berkas susulan')
    }
    return null
  }
  if (
    months === null ||
    !Number.isInteger(months) ||
    months < 1 ||
    months > 12
  ) {
    throw new BadRequestException(LIMIT_REQUIRED)
  }
  return months
}

@Injectable()
export class SaveDocumentTypeUseCase {
  constructor(private readonly repository: IAdmissionDocumentTypeRepository) {}

  async create(input: CreateDocumentTypeInput) {
    const name = this.requireName(input.name)
    const requirement = requirementOf(input)
    if (requirement === undefined) {
      throw new BadRequestException('Sifat berkas wajib dipilih')
    }
    const lateDueMonths = limitFor(requirement, input.lateDueMonths ?? null)
    await this.assertNameFree(name)
    const [codes, maxSortOrder] = await Promise.all([
      this.repository.findAllCodes(),
      this.repository.maxSortOrder(),
    ])
    return this.repository.create({
      name,
      requirement,
      lateDueMonths,
      isActive: input.isActive,
      code: documentTypeCode(name, new Set(codes)),
      sortOrder: maxSortOrder + 1,
    })
  }

  async update(id: string, input: UpdateDocumentTypeInput) {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Jenis berkas tidak ditemukan')
    }
    const name =
      input.name === undefined ? undefined : this.requireName(input.name)
    if (name !== undefined) await this.assertNameFree(name, id)
    return this.repository.update(id, {
      ...(name !== undefined && { name }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...this.requirementChange(existing, input),
    })
  }

  private requirementChange(
    existing: {
      requirement: DocumentRequirement
      lateDueMonths: number | null
    },
    input: UpdateDocumentTypeInput,
  ) {
    const requirement = requirementOf(input)
    if (requirement === undefined && input.lateDueMonths === undefined)
      return {}
    const effective = requirement ?? existing.requirement
    const months =
      input.lateDueMonths ??
      (existing.requirement === 'LATER' && effective === 'LATER'
        ? existing.lateDueMonths
        : null)
    return {
      requirement: effective,
      lateDueMonths: limitFor(effective, months),
    }
  }

  private requireName(raw: string) {
    const name = raw.trim()
    if (!name) throw new BadRequestException('Nama jenis berkas wajib diisi')
    return name
  }

  private async assertNameFree(name: string, exceptId?: string) {
    if (await this.repository.nameTaken(name, exceptId)) {
      throw new ConflictException('Nama jenis berkas sudah ada')
    }
  }
}
