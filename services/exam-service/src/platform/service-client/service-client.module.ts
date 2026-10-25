import { Global, Module } from '@nestjs/common'
import { ServiceClient } from './service-client.js'

@Global()
@Module({
  providers: [ServiceClient],
  exports: [ServiceClient],
})
export class ServiceClientModule {}
