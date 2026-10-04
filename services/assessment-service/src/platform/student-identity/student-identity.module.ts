import { Module } from '@nestjs/common'
import { IStudentIdentityReadPort } from './student-identity.port.js'
import { HttpStudentIdentityAdapter } from './http-student-identity.adapter.js'

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
