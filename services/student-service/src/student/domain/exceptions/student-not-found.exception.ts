import { NotFoundException } from '@nestjs/common'

export class StudentNotFoundException extends NotFoundException {
  constructor(studentId: string) {
    super(`Student with ID ${studentId} not found`)
  }
}
