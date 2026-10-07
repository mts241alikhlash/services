import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { Readable } from 'node:stream'
import { StorageService } from './storage.service.js'

function storageWith(send: jest.Mock) {
  const settings: Record<string, unknown> = {
    S3_BUCKET: 'bucket',
    S3_SIGNED_URL_EXPIRY_SECONDS: 60,
    S3_ENDPOINT: 'http://localhost:9000',
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY_ID: 'key',
    S3_SECRET_ACCESS_KEY: 'secret',
  }
  const storage = new StorageService({
    get: jest.fn((name: string) => settings[name]),
  } as never)
  ;(storage as unknown as { client: { send: jest.Mock } }).client = { send }
  return storage
}

describe('StorageService.getObject', () => {
  it('returns the stream with its type and length', async () => {
    const body = Readable.from(['abc'])
    const send = jest.fn().mockResolvedValue({
      Body: body,
      ContentType: 'application/pdf',
      ContentLength: 3,
    })

    const result = await storageWith(send).getObject('production/admission/a.pdf')

    expect(result).toEqual({
      stream: body,
      contentType: 'application/pdf',
      contentLength: 3,
    })
    expect(send).toHaveBeenCalledTimes(1)
    expect(
      (send.mock.calls[0][0] as { input: Record<string, string> }).input,
    ).toEqual({ Bucket: 'bucket', Key: 'production/admission/a.pdf' })
  })

  it.each(['NoSuchKey', 'NotFound'])('answers 404 for %s', async (name) => {
    const send = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('missing'), { name }))

    await expect(storageWith(send).getObject('k')).rejects.toThrow(
      new NotFoundException('Berkas tidak ditemukan di penyimpanan'),
    )
  })

  it('answers 500 for any other storage failure', async () => {
    const send = jest.fn().mockRejectedValue(new Error('connection reset'))

    await expect(storageWith(send).getObject('k')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    )
  })
})
