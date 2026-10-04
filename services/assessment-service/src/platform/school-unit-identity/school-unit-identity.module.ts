import { Module } from '@nestjs/common'
import { ISchoolUnitIdentityReadPort } from './school-unit-identity.port.js'
import { HttpSchoolUnitIdentityAdapter } from './http-school-unit-identity.adapter.js'

@Module({
  providers: [
    {
      provide: ISchoolUnitIdentityReadPort,
      useClass: HttpSchoolUnitIdentityAdapter,
    },
  ],
  exports: [ISchoolUnitIdentityReadPort],
})
export class SchoolUnitIdentityModule {}
