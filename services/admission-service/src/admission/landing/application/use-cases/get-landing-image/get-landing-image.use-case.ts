import { Injectable, NotFoundException } from '@nestjs/common'
import { ILandingRepository } from '../../../domain/repositories/landing-repository.js'
import { ILandingStorage } from '../../../domain/repositories/landing-storage.port.js'

@Injectable()
export class GetLandingImageUseCase {
  constructor(
    private readonly repository: ILandingRepository,
    private readonly storage: ILandingStorage,
  ) {}

  async execute(id: string) {
    const image = await this.repository.findImage(id)
    if (!image) throw new NotFoundException('Gambar tidak ditemukan')
    const { stream } = await this.storage.read(image.fileKey)
    return { image, stream }
  }
}
