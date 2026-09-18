import { Global, Module } from '@nestjs/common'
import { IStudentLookupPort } from './student-lookup.port.js'
import { HttpStudentLookupAdapter } from './http-student-lookup.adapter.js'

@Global()
@Module({
  providers: [
    { provide: IStudentLookupPort, useClass: HttpStudentLookupAdapter },
  ],
  exports: [IStudentLookupPort],
})
export class StudentLookupModule {}
