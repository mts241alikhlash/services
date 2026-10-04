import { Module } from '@nestjs/common'
import { HttpAccountProvisioningAdapter } from './infrastructure/http/http-account-provisioning.adapter.js'
import { IAccountProvisioningPort } from './domain/repositories/account-provisioning.port.js'

@Module({
  providers: [
    {
      provide: IAccountProvisioningPort,
      useClass: HttpAccountProvisioningAdapter,
    },
  ],
  exports: [IAccountProvisioningPort],
})
export class UserModule {}
