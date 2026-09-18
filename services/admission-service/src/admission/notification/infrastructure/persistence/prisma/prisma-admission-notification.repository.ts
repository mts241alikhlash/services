import { Injectable } from '@nestjs/common'
import type { AdmissionNotification } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  type AdmissionNotificationList,
  type CreateAdmissionNotificationInput,
  IAdmissionNotificationRepository,
} from '../../../domain/repositories/admission-notification-repository.js'

@Injectable()
export class PrismaAdmissionNotificationRepository extends IAdmissionNotificationRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async create(
    input: CreateAdmissionNotificationInput,
  ): Promise<AdmissionNotification> {
    return this.prisma.admissionNotification.create({
      data: input,
    })
  }

  async createForScope(
    waveId: string | null,
    title: string,
    message: string,
  ): Promise<void> {
    const applications = await this.prisma.admissionApplication.findMany({
      where: {
        deletedAt: null,
        ...(waveId && { waveId }),
      },
      select: { id: true },
    })
    if (applications.length === 0) return

    await this.prisma.admissionNotification.createMany({
      data: applications.map((application) => ({
        applicationId: application.id,
        type: 'ANNOUNCEMENT' as const,
        title,
        message,
      })),
    })
  }

  async findApplicationIdByUser(userId: string): Promise<string | null> {
    const application = await this.prisma.admissionApplication.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    })
    return application?.id ?? null
  }

  async findNotifications(
    applicationId: string,
  ): Promise<AdmissionNotificationList> {
    const [data, unreadCount] = await Promise.all([
      this.prisma.admissionNotification.findMany({
        where: { applicationId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.admissionNotification.count({
        where: { applicationId, readAt: null },
      }),
    ])
    return { data, unreadCount }
  }

  async findMyNotification(
    userId: string,
    notificationId: string,
  ): Promise<AdmissionNotification | null> {
    return this.prisma.admissionNotification.findFirst({
      where: {
        id: notificationId,
        application: { userId, deletedAt: null },
      },
    })
  }

  async markNotificationRead(
    notificationId: string,
    readAt: Date,
  ): Promise<AdmissionNotification> {
    return this.prisma.admissionNotification.update({
      where: { id: notificationId },
      data: { readAt },
    })
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.prisma.admissionNotification.updateMany({
      where: { application: { userId, deletedAt: null }, readAt: null },
      data: { readAt: new Date() },
    })
  }
}
