import { Global, Module } from '@nestjs/common'
import { HttpIdentityAdapter } from './http-identity.adapter.js'
import { IIdentityPort } from './identity.port.js'

@Global()
@Module({
  providers: [{ provide: IIdentityPort, useClass: HttpIdentityAdapter }],
  exports: [IIdentityPort],
})
export class IdentityModule {}
