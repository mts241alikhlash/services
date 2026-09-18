import { Module } from '@nestjs/common'
import { AuthModule } from '../platform/auth/auth.module.js'
import { UserModule } from '../platform/user/user.module.js'
import { AdmissionApplicantController } from './applicant/presentation/http/admission-applicant.controller.js'
import { AdmissionPublicController } from './applicant/presentation/http/admission-public.controller.js'
import { ApplicationModule } from './application/index.js'
import { WaveModule } from './wave/index.js'
import {
  AnnouncementModule,
  GetPublishedAnnouncementsUseCase,
} from './announcement/index.js'
import { GetActiveWavesUseCase } from './wave/index.js'
import { ApplicantModule } from './applicant/index.js'
import { DocumentModule } from './document/index.js'
import { PaymentModule } from './payment/index.js'
import { NotificationModule } from './notification/index.js'

@Module({
  imports: [
    AuthModule,
    UserModule,
    ApplicationModule,
    WaveModule,
    AnnouncementModule,
    ApplicantModule,
    DocumentModule,
    PaymentModule,
    NotificationModule,
  ],
  controllers: [AdmissionPublicController, AdmissionApplicantController],
  providers: [GetActiveWavesUseCase, GetPublishedAnnouncementsUseCase],
})
export class AdmissionModule {}
