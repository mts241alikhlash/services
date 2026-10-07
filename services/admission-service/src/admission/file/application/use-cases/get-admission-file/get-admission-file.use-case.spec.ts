import { NotFoundException } from '@nestjs/common'
import { Readable } from 'node:stream'
import { GetAdmissionFileUseCase } from './get-admission-file.use-case.js'

const file = {
  id: 'f1',
  originalName: 'kk.pdf',
  mimeType: 'application/pdf',
  storageKey: 'production/admission/documents/kk.pdf',
}

describe('GetAdmissionFileUseCase', () => {
  it('reads the stored object of a servable file', async () => {
    const stream = Readable.from(['x'])
    const files = { findServable: jest.fn().mockResolvedValue(file) }
    const content = { read: jest.fn().mockResolvedValue({ stream }) }

    const result = await new GetAdmissionFileUseCase(files, content).execute(
      'f1',
    )

    expect(content.read).toHaveBeenCalledWith(file.storageKey)
    expect(result).toEqual({ file, stream })
  })

  it('answers 404 without touching storage when the file is not an admission file', async () => {
    const files = { findServable: jest.fn().mockResolvedValue(null) }
    const content = { read: jest.fn() }

    await expect(
      new GetAdmissionFileUseCase(files as never, content as never).execute(
        'other',
      ),
    ).rejects.toThrow(new NotFoundException('Berkas tidak ditemukan'))
    expect(content.read).not.toHaveBeenCalled()
  })

  it('lets a missing object surface as 404', async () => {
    const files = { findServable: jest.fn().mockResolvedValue(file) }
    const content = {
      read: jest
        .fn()
        .mockRejectedValue(
          new NotFoundException('Berkas tidak ditemukan di penyimpanan'),
        ),
    }

    await expect(
      new GetAdmissionFileUseCase(files as never, content as never).execute(
        'f1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
