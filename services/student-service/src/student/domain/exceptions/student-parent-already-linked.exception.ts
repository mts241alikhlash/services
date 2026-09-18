import { ConflictException } from '@nestjs/common'

export class StudentParentAlreadyLinkedException extends ConflictException {
  constructor() {
    super('This parent is already linked to the specified student')
  }
}
