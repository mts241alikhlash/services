export interface NavItemEntity {
  id: string
  label: string
  pageId: string | null
  routeKey: string | null
  externalUrl: string | null
  displayOrder: number
  isActive: boolean
}

export interface PublicNavItem {
  id: string
  label: string
  href: string
  isExternal: boolean
}

export interface CreateNavItemInput {
  label: string
  pageId?: string | null
  routeKey?: string | null
  externalUrl?: string | null
  displayOrder?: number
  isActive?: boolean
}

export type UpdateNavItemInput = Partial<CreateNavItemInput>

export abstract class INavigationRepository {
  abstract findAll(): Promise<NavItemEntity[]>

  abstract findById(id: string): Promise<NavItemEntity | null>

  abstract findPublic(now?: Date): Promise<PublicNavItem[]>

  abstract create(data: CreateNavItemInput): Promise<NavItemEntity>

  abstract update(id: string, data: UpdateNavItemInput): Promise<NavItemEntity>

  abstract reorder(itemIds: string[]): Promise<void>

  abstract delete(id: string): Promise<void>
}
