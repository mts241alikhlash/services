import type {
  LandingImageEntity,
  LandingSectionRecord,
} from '../entities/landing.entity.js'

export interface CreateLandingImageRecord {
  fileKey: string
  width: number
  height: number
  sizeBytes: number
  createdById: string
}

export abstract class ILandingRepository {
  abstract findAllSections(): Promise<LandingSectionRecord[]>
  abstract saveDraft(
    key: string,
    document: unknown,
    userId: string,
  ): Promise<void>
  abstract publishAll(userId: string): Promise<number>
  abstract discardAll(): Promise<void>
  abstract findImage(id: string): Promise<LandingImageEntity | null>
  abstract findImagesByIds(ids: string[]): Promise<LandingImageEntity[]>
  abstract findAllImages(): Promise<LandingImageEntity[]>
  abstract createImage(
    input: CreateLandingImageRecord,
  ): Promise<LandingImageEntity>
  abstract deleteImages(ids: string[]): Promise<LandingImageEntity[]>
}
