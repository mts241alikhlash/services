import { Global, Module } from '@nestjs/common'
import { HttpStudentDirectoryAdapter } from './http-student-directory.adapter.js'
import { IStudentDirectoryPort } from './student-directory.port.js'

@Global()
@Module({
  providers: [
    { provide: IStudentDirectoryPort, useClass: HttpStudentDirectoryAdapter },
  ],
  exports: [IStudentDirectoryPort],
})
export class StudentDirectoryModule {}
