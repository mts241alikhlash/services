import { BadRequestException, Injectable } from '@nestjs/common'
import sharp from 'sharp'
import { LANDING_IMAGE_REJECTED } from '../../domain/policies/landing-image-upload.policy.js'
import {
  ILandingImageProcessor,
  type LandingImagePurpose,
  type ProcessedLandingImage,
} from '../../domain/repositories/landing-image-processor.port.js'

const BOX: Record<LandingImagePurpose, { width: number; height: number }> = {
  poster: { width: 1080, height: 1920 },
  photo: { width: 1600, height: 1600 },
}

const WEBP_QUALITY = 82
const MAX_INPUT_PIXELS = 40_000_000

@Injectable()
export class SharpLandingImageProcessor extends ILandingImageProcessor {
  constructor(private readonly limitInputPixels = MAX_INPUT_PIXELS) {
    super()
  }

  async process(
    buffer: Buffer,
    purpose: LandingImagePurpose,
  ): Promise<ProcessedLandingImage> {
    try {
      const { data, info } = await sharp(buffer, {
        limitInputPixels: this.limitInputPixels,
      })
        .rotate()
        .resize({ ...BOX[purpose], fit: 'inside', withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer({ resolveWithObject: true })
      return { content: data, width: info.width, height: info.height }
    } catch {
      throw new BadRequestException(LANDING_IMAGE_REJECTED)
    }
  }
}
