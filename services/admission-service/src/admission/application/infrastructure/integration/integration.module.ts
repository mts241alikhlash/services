import { Module } from '@nestjs/common'
import { HttpStudentEnrolmentAdapter } from './http-student-enrolment.adapter.js'
import { IStudentEnrolmentPort } from './student-enrolment.port.js'

@Module({
  providers: [
    { provide: IStudentEnrolmentPort, useClass: HttpStudentEnrolmentAdapter },
  ],
  exports: [IStudentEnrolmentPort],
})
export class IntegrationModule {}
