import { ConflictException } from '@nestjs/common'

export class StudentNisAlreadyExistsException extends ConflictException {
  constructor(nis: string) {
    super(`NIS "${nis}" is already registered`)
  }
}
