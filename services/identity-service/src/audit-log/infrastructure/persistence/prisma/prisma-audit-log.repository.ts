import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  AuditLogQueryInput,
  CreateAuditLogRepositoryInput,
  IAuditLogRepository,
} from '../../../domain/repositories/audit-log.repository.js'

@Injectable()
export class PrismaAuditLogRepository extends IAuditLogRepository {
  async summarise(since: Date) {
    const [total, recent] = await this.prisma.$transaction([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
    ])
    return { total, since: recent }
  }

  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(query: AuditLogQueryInput) {
    const { page = 1, limit = 10, search, userId, action, resource } = query
    const skip = (page - 1) * limit

    const where: Prisma.AuditLogWhereInput = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(resource && { resource }),
      ...(search && {
        OR: [
          { action: { contains: search, mode: 'insensitive' } },
          { resource: { contains: search, mode: 'insensitive' } },
          { userAgent: { contains: search, mode: 'insensitive' } },
          { ipAddress: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              identifier: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async create(data: CreateAuditLogRepositoryInput) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId ?? null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId ?? null,
        metadata: data.metadata ?? Prisma.JsonNull,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    })
  }
}
