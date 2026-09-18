import { InternalServerErrorException } from '@nestjs/common'

export class StudentCreationFailedException extends InternalServerErrorException {
  constructor() {
    super('Student creation failed: user was created without a student record')
  }
}
