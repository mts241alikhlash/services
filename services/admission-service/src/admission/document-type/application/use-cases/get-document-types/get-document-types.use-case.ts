import { Injectable } from '@nestjs/common'
import { IAdmissionDocumentTypeRepository } from '../../../domain/repositories/admission-document-type-repository.js'

@Injectable()
export class GetDocumentTypesUseCase {
  constructor(private readonly repository: IAdmissionDocumentTypeRepository) {}

  execute() {
    return this.repository.findAll()
  }
}
