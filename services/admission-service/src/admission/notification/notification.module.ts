import { Module } from '@nestjs/common'
import { GetMyNotificationsUseCase } from './application/use-cases/get-my-notifications/get-my-notifications.use-case.js'
import { MarkNotificationReadUseCase } from './application/use-cases/mark-notification-read/mark-notification-read.use-case.js'
import { AdmissionNotificationService } from './application/services/admission-notification.service.js'
import { IAdmissionNotificationRepository } from './domain/repositories/admission-notification-repository.js'
import { PrismaAdmissionNotificationRepository } from './infrastructure/persistence/prisma/prisma-admission-notification.repository.js'
import { AdmissionNotificationController } from './presentation/http/admission-notification.controller.js'

@Module({
  controllers: [AdmissionNotificationController],
  providers: [
    {
      provide: IAdmissionNotificationRepository,
      useClass: PrismaAdmissionNotificationRepository,
    },
    AdmissionNotificationService,
    GetMyNotificationsUseCase,
    MarkNotificationReadUseCase,
  ],
  exports: [
    AdmissionNotificationService,
    GetMyNotificationsUseCase,
    MarkNotificationReadUseCase,
  ],
})
export class NotificationModule {}
