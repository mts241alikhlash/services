import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { NotificationModule } from '../notification/notification.module.js'
import { AdmissionAnnouncementController } from './presentation/http/admission-announcement.controller.js'
import { PrismaAdmissionAnnouncementRepository } from './infrastructure/persistence/prisma/prisma-admission-announcement.repository.js'
import { CreateAdmissionAnnouncementUseCase } from './application/use-cases/create-admission-announcement/create-admission-announcement.use-case.js'
import { DeleteAdmissionAnnouncementUseCase } from './application/use-cases/delete-admission-announcement/delete-admission-announcement.use-case.js'
import { GetAdmissionAnnouncementsUseCase } from './application/use-cases/get-admission-announcements/get-admission-announcements.use-case.js'
import { PublishAdmissionAnnouncementUseCase } from './application/use-cases/publish-admission-announcement/publish-admission-announcement.use-case.js'
import { UpdateAdmissionAnnouncementUseCase } from './application/use-cases/update-admission-announcement/update-admission-announcement.use-case.js'
import { IAdmissionAnnouncementRepository } from './domain/repositories/admission-announcement-repository.js'

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [AdmissionAnnouncementController],
  providers: [
    {
      provide: IAdmissionAnnouncementRepository,
      useClass: PrismaAdmissionAnnouncementRepository,
    },
    GetAdmissionAnnouncementsUseCase,
    CreateAdmissionAnnouncementUseCase,
    UpdateAdmissionAnnouncementUseCase,
    PublishAdmissionAnnouncementUseCase,
    DeleteAdmissionAnnouncementUseCase,
  ],
})
export class AnnouncementModule {}
