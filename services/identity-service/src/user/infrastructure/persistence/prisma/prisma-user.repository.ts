import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  AccountLookupInput,
  AccountLookupResult,
  IUserRepository,
  ProfileRecord,
  ProfileSummaryEntity,
  ProvisionAccountRepositoryInput,
  ProvisionedAccount,
  UpdateProfileRepositoryInput,
  UserQueryInput,
} from '../../../domain/repositories/user.repository.js'
import { PUBLIC_USER_SELECT } from './prisma-user.includes.js'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'

@Injectable()
export class PrismaUserRepository extends IUserRepository {
  async summarise() {
    const [total, active] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    ])
    return { total, active, inactive: total - active }
  }

  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(query: UserQueryInput) {
    const { page = 1, limit = 10, roleCode, search } = query
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(roleCode && {
        userRoles: {
          some: {
            role: {
              code: roleCode,
            },
          },
        },
      }),
      ...(search && {
        OR: [
          {
            identifier: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            profile: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: PUBLIC_USER_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: PUBLIC_USER_SELECT,
    })
  }

  async findByIdWithPassword(id: string) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } })
  }

  async findByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: { identifier, deletedAt: null },
      select: PUBLIC_USER_SELECT,
    })
  }

  async findByIdentifierWithPassword(identifier: string) {
    return this.prisma.user.findFirst({
      where: { identifier, deletedAt: null },
    })
  }

  async existsByIdentifier(identifier: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { identifier, deletedAt: null },
      select: { id: true },
    })
    return !!user
  }

  async existsById(id: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    return !!user
  }

  async create(data: { identifier: string; passwordHash: string }) {
    return this.prisma.user.create({
      data,
      select: PUBLIC_USER_SELECT,
    })
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: PUBLIC_USER_SELECT,
    })
  }

  async remove(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      select: PUBLIC_USER_SELECT,
    })
  }

  async provisionAccount(
    input: ProvisionAccountRepositoryInput,
  ): Promise<ProvisionedAccount> {
    return this.prisma.$transaction(async (tx) => {
      const profile = input.profile
      const { address, ...profileFields } = profile ?? { address: undefined }

      const user = await tx.user.create({
        data: {
          identifier: input.identifier,
          passwordHash: input.passwordHash,
          ...(profile && {
            profile: {
              create: {
                ...(profileFields as Omit<typeof profile, 'address'>),
                ...(address && {
                  addresses: { create: { ...address, isPrimary: true } },
                }),
              },
            },
          }),
        },
      })

      if (input.roleCode) {
        const role = await tx.role.findUnique({
          where: { code: input.roleCode },
        })

        if (!role) {
          throw new InternalServerErrorException(
            `The ${input.roleCode} role does not exist, so this account cannot be given one. ` +
              'It is created automatically when the application starts; if it is missing, restart the backend or add it on the role screen.',
          )
        }

        await tx.userRole.create({
          data: { userId: user.id, roleId: role.id },
        })
      }

      return { id: user.id }
    })
  }

  async findProfilesByUserIds(
    userIds: string[],
  ): Promise<ProfileSummaryEntity[]> {
    if (userIds.length === 0) return []

    const rows = await this.prisma.user.findMany({
      where: { id: { in: userIds }, deletedAt: null, profile: { isNot: null } },
      select: {
        id: true,
        identifier: true,
        isActive: true,
        profile: {
          select: {
            name: true,
            gender: true,
            nik: true,
            birthPlace: true,
            birthDate: true,
            email: true,
            phone: true,
            avatarFile: { select: { storageKey: true } },
          },
        },
      },
    })

    return rows
      .filter(
        (
          row,
        ): row is typeof row & { profile: NonNullable<typeof row.profile> } =>
          row.profile !== null,
      )
      .map((row) => ({
        userId: row.id,
        identifier: row.identifier,
        isActive: row.isActive,
        name: row.profile.name,
        gender: row.profile.gender as UserGender,
        nik: row.profile.nik,
        avatarStorageKey: row.profile.avatarFile?.storageKey ?? null,
        birthPlace: row.profile.birthPlace,
        birthDate: row.profile.birthDate,
        email: row.profile.email,
        phone: row.profile.phone,
      }))
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileRepositoryInput,
  ): Promise<ProfileRecord> {
    const exists = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!exists) {
      if (
        !data.name ||
        !data.nik ||
        !data.gender ||
        !data.birthPlace ||
        !data.birthDate
      ) {
        throw new BadRequestException(
          'This account has no profile yet — creating one requires name, nik, gender, birthPlace, and birthDate.',
        )
      }

      const created = await this.prisma.profile.create({
        data: {
          userId,
          name: data.name,
          nik: data.nik,
          gender: data.gender,
          birthPlace: data.birthPlace,
          birthDate: data.birthDate,
          email: data.email,
          phone: data.phone,
        },
      })

      return {
        id: created.id,
        userId: created.userId,
        name: created.name,
        nik: created.nik,
        gender: created.gender as UserGender,
        birthPlace: created.birthPlace,
        birthDate: created.birthDate,
        email: created.email,
        phone: created.phone,
      }
    }

    const profile = await this.prisma.profile.update({
      where: { userId },
      data,
    })

    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      nik: profile.nik,
      gender: profile.gender as UserGender,
      birthPlace: profile.birthPlace,
      birthDate: profile.birthDate,
      email: profile.email,
      phone: profile.phone,
    }
  }

  async lookupAccount(input: AccountLookupInput): Promise<AccountLookupResult> {
    const [identifierTaken, nikOwner] = await Promise.all([
      input.identifier
        ? this.existsByIdentifier(input.identifier)
        : Promise.resolve(false),
      input.nik
        ? this.prisma.profile.findUnique({
            where: { nik: input.nik },
            select: { userId: true },
          })
        : Promise.resolve(null),
    ])

    return { identifierTaken, nikOwnerId: nikOwner?.userId ?? null }
  }

  async assignRole(userId: string, roleCode: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
      select: { id: true },
    })
    if (!role) {
      throw new InternalServerErrorException(
        `The ${roleCode} role does not exist, so it cannot be assigned. It is created automatically when the application starts; if it is missing, restart the backend or add it on the role screen.`,
      )
    }

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      create: { userId, roleId: role.id },
      update: {},
    })
  }
}
