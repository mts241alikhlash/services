import { BadRequestException, PayloadTooLargeException } from '@nestjs/common'
import { EXAM_IMAGE_MAX_BYTES } from '../../../domain/policies/detect-image-type.policy.js'
import {
  FakeExamFileRepository,
  FakeExamFileStorage,
} from '../../exam-file.fakes.fake.js'
import { UploadExamFileUseCase } from './upload-exam-file.use-case.js'

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32),
])

function build() {
  const files = new FakeExamFileRepository()
  const storage = new FakeExamFileStorage()
  return { files, storage, useCase: new UploadExamFileUseCase(files, storage) }
}

const upload = (buffer: Buffer, name = 'grafik.png') => ({
  buffer,
  size: buffer.length,
  originalName: name,
  uploadedById: 'user-1',
})

describe('UploadExamFileUseCase', () => {
  it('stores a valid PNG and records it with the type read from its bytes', async () => {
    const { files, storage, useCase } = build()

    const file = await useCase.execute(upload(png, 'foto.jpg'))

    expect(file).toMatchObject({
      mimeType: 'image/png',
      sizeBytes: png.length,
      originalName: 'foto.jpg',
      uploadedById: 'user-1',
    })
    expect(file.storageKey).toBe(`exam/questions/${file.id}`)
    expect(storage.objects.get(file.storageKey)).toEqual({
      content: png,
      mimeType: 'image/png',
    })
    expect(files.files.get(file.id)).toBeDefined()
  })

  it('refuses a PDF renamed to .png', async () => {
    const { files, storage, useCase } = build()

    await expect(
      useCase.execute(upload(Buffer.from('%PDF-1.7\n....'), 'kunci.png')),
    ).rejects.toThrow(
      new BadRequestException('Gambar harus JPG, PNG, atau WebP'),
    )
    expect(storage.objects.size).toBe(0)
    expect(files.files.size).toBe(0)
  })

  it('refuses one byte over 2 MB, and accepts exactly 2 MB', async () => {
    const { useCase } = build()
    const exact = Buffer.concat([
      png,
      Buffer.alloc(EXAM_IMAGE_MAX_BYTES - png.length),
    ])
    const over = Buffer.concat([exact, Buffer.alloc(1)])

    await expect(useCase.execute(upload(over))).rejects.toThrow(
      new PayloadTooLargeException('Ukuran gambar maksimal 2 MB'),
    )
    await expect(useCase.execute(upload(exact))).resolves.toMatchObject({
      sizeBytes: EXAM_IMAGE_MAX_BYTES,
    })
  })

  it('refuses an empty file', async () => {
    const { useCase } = build()

    await expect(useCase.execute(upload(Buffer.alloc(0)))).rejects.toThrow(
      BadRequestException,
    )
  })
})
