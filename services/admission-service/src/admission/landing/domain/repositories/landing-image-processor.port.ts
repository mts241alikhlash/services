export type LandingImagePurpose = 'poster' | 'photo'

export interface ProcessedLandingImage {
  content: Buffer
  width: number
  height: number
}

export abstract class ILandingImageProcessor {
  abstract process(
    buffer: Buffer,
    purpose: LandingImagePurpose,
  ): Promise<ProcessedLandingImage>
}
