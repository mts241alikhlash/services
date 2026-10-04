import { NotFoundException } from '@nestjs/common'

export class StudentParentLinkNotFoundException extends NotFoundException {
  constructor(linkId: string) {
    super(`Student-parent link with ID ${linkId} not found`)
  }
}
