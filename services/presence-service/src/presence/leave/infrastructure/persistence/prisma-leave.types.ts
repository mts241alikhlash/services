import { PrismaService } from '../../../../core/database/prisma.service.js'
import { LeaveTypeEntity } from '../../domain/entities/leave.entity.js'
import {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
} from '../../domain/interfaces/leave-repository.interface.js'

export async function findTypes(
  prisma: PrismaService,
  includeInactive = false,
): Promise<LeaveTypeEntity[]> {
  return prisma.leaveType.findMany({
    where: { deletedAt: null, ...(includeInactive ? {} : { isActive: true }) },
    orderBy: { name: 'asc' },
  })
}

export async function findTypeById(
  prisma: PrismaService,
  id: string,
): Promise<LeaveTypeEntity | null> {
  return prisma.leaveType.findFirst({ where: { id, deletedAt: null } })
}

export async function createType(
  prisma: PrismaService,
  input: CreateLeaveTypeInput,
): Promise<LeaveTypeEntity> {
  return prisma.leaveType.create({ data: input })
}

export async function updateType(
  prisma: PrismaService,
  id: string,
  input: UpdateLeaveTypeInput,
): Promise<LeaveTypeEntity> {
  return prisma.leaveType.update({ where: { id }, data: input })
}

export async function softDeleteType(
  prisma: PrismaService,
  id: string,
): Promise<LeaveTypeEntity> {
  return prisma.leaveType.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  })
}

export async function countRequestsOfType(
  prisma: PrismaService,
  leaveTypeId: string,
): Promise<number> {
  return prisma.leaveRequest.count({ where: { leaveTypeId, deletedAt: null } })
}
