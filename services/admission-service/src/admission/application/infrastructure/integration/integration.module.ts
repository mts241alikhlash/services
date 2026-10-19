import { Module } from '@nestjs/common'
import { HttpStudentEnrollmentAdapter } from './http-student-enrollment.adapter.js'
import { IStudentEnrollmentPort } from './student-enrollment.port.js'

@Module({
  providers: [
    { provide: IStudentEnrollmentPort, useClass: HttpStudentEnrollmentAdapter },
  ],
  exports: [IStudentEnrollmentPort],
})
export class IntegrationModule {}
