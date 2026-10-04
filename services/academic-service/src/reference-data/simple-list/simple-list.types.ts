import type { Type } from '@nestjs/common'

export interface SimpleListItem {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  deletedAt?: Date | null
}

export interface SimpleListQuery {
  page: number
  limit: number
  search?: string
  isActive?: boolean
}

export interface SimpleListCreate {
  name: string
  sortOrder?: number
  isActive?: boolean
}

export interface SimpleListUpdate {
  name?: string
  sortOrder?: number
  isActive?: boolean
}

export interface SimpleListDelegate {
  findMany(args: {
    where?: object
    skip?: number
    take?: number
    orderBy?: object[]
  }): Promise<SimpleListItem[]>
  count(args: { where?: object }): Promise<number>
  findFirst(args: { where?: object }): Promise<SimpleListItem | null>
  create(args: { data: SimpleListCreate }): Promise<SimpleListItem>
  update(args: {
    where: { id: string }
    data: SimpleListUpdate | { deletedAt: Date }
  }): Promise<SimpleListItem>
}

export abstract class ISimpleListUsage {
  abstract count(id: string): Promise<number>
}

export type SimpleListModel =
  | 'occupation'
  | 'education'
  | 'incomeRange'
  | 'financingSource'
  | 'disabilityType'
  | 'specialNeed'
  | 'studentResidence'
  | 'parentResidence'
  | 'transportation'
  | 'travelDistance'
  | 'travelTime'
  | 'parentLifeStatus'
  | 'domicile'
  | 'scholarshipCategory'
  | 'scholarshipProviderType'
  | 'competitionField'
  | 'competitionLevel'

export interface SimpleListDefinition {
  model: SimpleListModel
  path: string
  permission: string
  className: string
  label: string
  tag: string
  usage?: Type<ISimpleListUsage>
}
