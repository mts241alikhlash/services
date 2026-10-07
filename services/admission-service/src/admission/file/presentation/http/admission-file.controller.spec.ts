import 'reflect-metadata'
import { StreamableFile } from '@nestjs/common'
import { Readable } from 'node:stream'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { AdmissionFileController } from './admission-file.controller.js'

const file = {
  id: 'f1',
  originalName: 'kk.pdf',
  mimeType: 'application/pdf',
  storageKey: 'production/admission/documents/kk.pdf',
}

function setup() {
  const stream = Readable.from(['x'])
  const getFile = { execute: jest.fn().mockResolvedValue({ file, stream }) }
  const res = { set: jest.fn() }
  const controller = new AdmissionFileController(getFile as never)
  return { controller, getFile, res, stream }
}

describe('AdmissionFileController', () => {
  it('needs admissions.read', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        AdmissionFileController.prototype.stream,
      ),
    ).toEqual(['admissions.read'])
  })

  it('streams the file inline with its stored type', async () => {
    const { controller, getFile, res, stream } = setup()

    const result = await controller.stream('f1', undefined, res as never)

    expect(getFile.execute).toHaveBeenCalledWith('f1')
    expect(res.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="kk.pdf"; filename*=UTF-8''kk.pdf`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=300',
    })
    expect(result).toBeInstanceOf(StreamableFile)
    expect(result.getStream()).toBe(stream)
  })

  it('downloads instead of showing inline with download=1', async () => {
    const { controller, res } = setup()

    await controller.stream('f1', '1', res as never)

    expect(
      (res.set.mock.calls[0][0] as Record<string, string>)[
        'Content-Disposition'
      ],
    ).toMatch(/^attachment;/)
  })

  it('ignores any other download value', async () => {
    const { controller, res } = setup()

    await controller.stream('f1', 'yes', res as never)

    expect(
      (res.set.mock.calls[0][0] as Record<string, string>)[
        'Content-Disposition'
      ],
    ).toMatch(/^inline;/)
  })
})
