import { Injectable } from '@nestjs/common'
import { IParentLookupPort } from '../../platform/parent-lookup/parent-lookup.port.js'
import { ISimpleListUsage } from './simple-list.types.js'

@Injectable()
export class OccupationUsage extends ISimpleListUsage {
  constructor(private readonly parentLookup: IParentLookupPort) {
    super()
  }

  count(id: string): Promise<number> {
    return this.parentLookup.countByOccupation(id)
  }
}
