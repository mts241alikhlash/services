import { Global, Module } from '@nestjs/common'
import { HttpStudentIdentityAdapter } from './http-student-identity.adapter.js'
import { IStudentIdentityReadPort } from './student-identity.port.js'

@Global()
@Module({
  providers: [
    {
      provide: IStudentIdentityReadPort,
      useClass: HttpStudentIdentityAdapter,
    },
  ],
  exports: [IStudentIdentityReadPort],
})
export class StudentIdentityModule {}
