import { Injectable } from '@nestjs/common'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'

@Injectable()
export class GetActiveGradesUseCase {
  constructor(private readonly lookup: IReferenceLookupPort) {}

  execute() {
    return this.lookup.activeGrades()
  }
}
