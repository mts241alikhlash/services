import { ConflictException, Injectable } from '@nestjs/common'
import { Prisma } from '../../../../../generated/prisma/client.js'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { AdmissionDocumentTypeEntity } from '../../../domain/entities/admission-document-type.entity.js'
import {
  IAdmissionDocumentTypeRepository,
  type CreateDocumentTypeRecord,
  type UpdateDocumentTypeInput,
} from '../../../domain/repositories/admission-document-type-repository.js'

const SELECT = {
  id: true,
  code: true,
  name: true,
  isRequired: true,
  isActive: true,
  sortOrder: true,
  _count: { select: { documents: true } },
} as const

function toEntity(row: {
  id: string
  code: string
  name: string
  isRequired: boolean
  isActive: boolean
  sortOrder: number
  _count: { documents: number }
}): AdmissionDocumentTypeEntity {
  const { _count, ...rest } = row
  return { ...rest, documentCount: _count.documents }
}

function isKnownError(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  )
}

@Injectable()
export class PrismaAdmissionDocumentTypeRepository extends IAdmissionDocumentTypeRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(): Promise<AdmissionDocumentTypeEntity[]> {
    const rows = await this.prisma.admissionDocumentType.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: SELECT,
    })
    return rows.map(toEntity)
  }

  async findById(id: string): Promise<AdmissionDocumentTypeEntity | null> {
    const row = await this.prisma.admissionDocumentType.findUnique({
      where: { id },
      select: SELECT,
    })
    return row ? toEntity(row) : null
  }

  async nameTaken(name: string, exceptId?: string): Promise<boolean> {
    const row = await this.prisma.admissionDocumentType.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId && { NOT: { id: exceptId } }),
      },
      select: { id: true },
    })
    return row !== null
  }

  async findAllCodes(): Promise<string[]> {
    const rows = await this.prisma.admissionDocumentType.findMany({
      select: { code: true },
    })
    return rows.map((row) => row.code)
  }

  async maxSortOrder(): Promise<number> {
    const result = await this.prisma.admissionDocumentType.aggregate({
      _max: { sortOrder: true },
    })
    return result._max.sortOrder ?? 0
  }

  async create(
    input: CreateDocumentTypeRecord,
  ): Promise<AdmissionDocumentTypeEntity> {
    try {
      return toEntity(
        await this.prisma.admissionDocumentType.create({
          data: input,
          select: SELECT,
        }),
      )
    } catch (error) {
      if (isKnownError(error, 'P2002')) {
        throw new ConflictException('Nama jenis berkas sudah ada')
      }
      throw error
    }
  }

  async update(
    id: string,
    input: UpdateDocumentTypeInput,
  ): Promise<AdmissionDocumentTypeEntity> {
    return toEntity(
      await this.prisma.admissionDocumentType.update({
        where: { id },
        data: input,
        select: SELECT,
      }),
    )
  }

  async reorder(ids: string[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.admissionDocumentType.update({
          where: { id },
          data: { sortOrder: index + 1 },
        }),
      ),
    )
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.admissionDocumentType.delete({ where: { id } })
    } catch (error) {
      if (isKnownError(error, 'P2003')) {
        throw new ConflictException(
          'Jenis berkas sudah dipakai, nonaktifkan saja',
        )
      }
      throw error
    }
  }
}
