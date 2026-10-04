import { BadRequestException } from '@nestjs/common'
import { AppKey } from '../../../shared/domain/enums/app-key.enum.js'
import { MAX_UPLOAD_BYTES } from '../../../core/upload/upload-limits.js'
import { UploadFileUseCase } from './upload-file.use-case.js'

describe('UploadFileUseCase', () => {
  it('refuses anything over 5 MB before it reaches storage', async () => {
    const storage = { uploadFile: jest.fn() }
    const useCase = new UploadFileUseCase(
      {} as never,
      {} as never,
      storage as never,
      {} as never,
    )
    const file = {
      buffer: Buffer.alloc(MAX_UPLOAD_BYTES + 1),
      originalname: 'big.png',
      mimetype: 'image/png',
      size: MAX_UPLOAD_BYTES + 1,
    } as Express.Multer.File

    await expect(
      useCase.execute(file, Object.values(AppKey)[0]),
    ).rejects.toThrow(
      new BadRequestException('File size exceeds the maximum limit of 5MB'),
    )
    expect(storage.uploadFile).not.toHaveBeenCalled()
  })
})
