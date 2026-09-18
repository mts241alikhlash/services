import { ConflictException } from '@nestjs/common'

export class StudentNisnAlreadyExistsException extends ConflictException {
  constructor(nisn: string) {
    super(`NISN "${nisn}" is already registered`)
  }
}
