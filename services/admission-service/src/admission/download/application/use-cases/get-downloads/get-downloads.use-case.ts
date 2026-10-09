import { Injectable } from '@nestjs/common'
import { IAdmissionDownloadRepository } from '../../../domain/repositories/admission-download-repository.js'

@Injectable()
export class GetDownloadsUseCase {
  constructor(private readonly repository: IAdmissionDownloadRepository) {}

  all() {
    return this.repository.findAll()
  }

  active() {
    return this.repository.findActive()
  }
}
