import { BadRequestException, StreamableFile } from '@nestjs/common'
import type { Response } from 'express'
import {
  FakeExamFileRepository,
  FakeExamFileStorage,
} from '../../application/exam-file.fakes.fake.js'
import { GetExamFileUseCase } from '../../application/use-cases/get-exam-file/get-exam-file.use-case.js'
import { UploadExamFileUseCase } from '../../application/use-cases/upload-exam-file/upload-exam-file.use-case.js'
import { ExamFileController } from './exam-file.controller.js'

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
])
const user = { id: 'user-1', roles: [], permissions: [] }

function build() {
  const files = new FakeExamFileRepository()
  const storage = new FakeExamFileStorage()
  return new ExamFileController(
    new UploadExamFileUseCase(files, storage),
    new GetExamFileUseCase(files, storage),
  )
}

describe('ExamFileController', () => {
  it('uploads an image and streams it back with private caching', async () => {
    const controller = build()
    const stored = await controller.upload(user, {
      buffer: png,
      size: png.length,
      originalname: 'a.png',
    } as Express.Multer.File)
    const set = jest.fn()

    const streamed = await controller.download(stored.id, {
      set,
    } as unknown as Response)

    expect(stored).toEqual({
      id: expect.any(String) as string,
      mimeType: 'image/png',
      sizeBytes: png.length,
    })
    expect(streamed).toBeInstanceOf(StreamableFile)
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      }),
    )
  })

  it('refuses a request with no file', async () => {
    await expect(build().upload(user, undefined)).rejects.toThrow(
      BadRequestException,
    )
  })
})
