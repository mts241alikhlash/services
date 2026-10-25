import { NotFoundException } from '@nestjs/common'
import {
  FakeExamFileRepository,
  FakeExamFileStorage,
} from '../../exam-file.fakes.fake.js'
import { UploadExamFileUseCase } from '../upload-exam-file/upload-exam-file.use-case.js'
import { GetExamFileUseCase } from './get-exam-file.use-case.js'

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
])

describe('GetExamFileUseCase', () => {
  it('returns the stored bytes with the recorded mime type', async () => {
    const files = new FakeExamFileRepository()
    const storage = new FakeExamFileStorage()
    const stored = await new UploadExamFileUseCase(files, storage).execute({
      buffer: png,
      size: png.length,
      originalName: 'a.png',
      uploadedById: 'user-1',
    })

    const { file, stream } = await new GetExamFileUseCase(
      files,
      storage,
    ).execute(stored.id)

    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    expect(file.mimeType).toBe('image/png')
    expect(Buffer.concat(chunks)).toEqual(png)
  })

  it('answers 404 for an unknown id', async () => {
    const useCase = new GetExamFileUseCase(
      new FakeExamFileRepository(),
      new FakeExamFileStorage(),
    )

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException)
  })
})
