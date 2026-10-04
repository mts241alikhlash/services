import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { AdmissionBankAccountEntity } from '../../../domain/entities/admission-bank-account.entity.js'
import {
  IAdmissionBankAccountRepository,
  type SaveAdmissionBankAccountInput,
} from '../../../domain/repositories/admission-bank-account-repository.js'

const SELECT = {
  id: true,
  bankName: true,
  accountNumber: true,
  accountHolder: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const

@Injectable()
export class PrismaAdmissionBankAccountRepository extends IAdmissionBankAccountRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  findAll(query: {
    activeOnly: boolean
  }): Promise<AdmissionBankAccountEntity[]> {
    return this.prisma.admissionBankAccount.findMany({
      where: { deletedAt: null, ...(query.activeOnly && { isActive: true }) },
      orderBy: [{ sortOrder: 'asc' }, { bankName: 'asc' }],
      select: SELECT,
    })
  }

  findById(id: string): Promise<AdmissionBankAccountEntity | null> {
    return this.prisma.admissionBankAccount.findFirst({
      where: { id, deletedAt: null },
      select: SELECT,
    })
  }

  create(
    input: SaveAdmissionBankAccountInput &
      Pick<
        AdmissionBankAccountEntity,
        'bankName' | 'accountNumber' | 'accountHolder'
      >,
  ): Promise<AdmissionBankAccountEntity> {
    return this.prisma.admissionBankAccount.create({
      data: input,
      select: SELECT,
    })
  }

  update(
    id: string,
    input: SaveAdmissionBankAccountInput,
  ): Promise<AdmissionBankAccountEntity> {
    return this.prisma.admissionBankAccount.update({
      where: { id },
      data: input,
      select: SELECT,
    })
  }

  softDelete(id: string): Promise<AdmissionBankAccountEntity> {
    return this.prisma.admissionBankAccount.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      select: SELECT,
    })
  }
}
