import 'reflect-metadata'
import { StreamableFile } from '@nestjs/common'
import { Readable } from 'node:stream'
import { IS_PUBLIC_KEY } from '../../../../core/decorators/public.decorator.js'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { AdmissionDownloadController } from './admission-download.controller.js'
import { AdmissionDownloadPublicController } from './admission-download-public.controller.js'

const download = {
  id: 'd1',
  title: 'Brosur PPDB',
  description: null,
  fileKey: 'admission-downloads/secret.pdf',
  fileName: 'Brosur "PPDB".pdf',
  sizeBytes: 20,
  sortOrder: 1,
  isActive: true,
  createdAt: new Date('2026-10-09T01:02:03Z'),
  updatedAt: new Date('2026-10-09T04:05:06Z'),
}

describe('AdmissionDownloadController permissions', () => {
  const proto = AdmissionDownloadController.prototype
  const needs = (handler: keyof typeof proto) =>
    Reflect.getMetadata(PERMISSIONS_KEY, proto[handler])

  it('names one code per handler', () => {
    expect(needs('findAll')).toEqual(['admission-downloads.read'])
    expect(needs('create')).toEqual(['admission-downloads.create'])
    expect(needs('reorder')).toEqual(['admission-downloads.update'])
    expect(needs('update')).toEqual(['admission-downloads.update'])
    expect(needs('remove')).toEqual(['admission-downloads.delete'])
  })

  it('never exposes the object key', async () => {
    const list = { all: jest.fn().mockResolvedValue([download]) }
    const controller = new AdmissionDownloadController(
      list as never,
      {} as never,
      {} as never,
      {} as never,
    )

    const body = await controller.findAll()

    expect(body.data[0]).toEqual({
      id: 'd1',
      title: 'Brosur PPDB',
      description: null,
      fileName: 'Brosur "PPDB".pdf',
      sizeBytes: 20,
      sortOrder: 1,
      isActive: true,
      createdAt: '2026-10-09T01:02:03.000Z',
      updatedAt: '2026-10-09T04:05:06.000Z',
    })
    expect(JSON.stringify(body)).not.toContain('secret.pdf')
  })
})

describe('AdmissionDownloadPublicController', () => {
  const proto = AdmissionDownloadPublicController.prototype

  it('is public on both routes', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, proto.findActive)).toBe(true)
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, proto.file)).toBe(true)
  })

  it('lists only what visitors need', async () => {
    const list = { active: jest.fn().mockResolvedValue([download]) }
    const controller = new AdmissionDownloadPublicController(
      list as never,
      {} as never,
    )

    const body = await controller.findActive()

    expect(body.data).toEqual([
      {
        id: 'd1',
        title: 'Brosur PPDB',
        description: null,
        fileName: 'Brosur "PPDB".pdf',
        sizeBytes: 20,
      },
    ])
  })

  it('streams the PDF as a cacheable attachment', async () => {
    const stream = Readable.from(['x'])
    const getFile = {
      execute: jest.fn().mockResolvedValue({ download, stream }),
    }
    const res = { set: jest.fn() }
    const controller = new AdmissionDownloadPublicController(
      {} as never,
      getFile as never,
    )

    const result = await controller.file('d1', res as never)

    expect(getFile.execute).toHaveBeenCalledWith('d1')
    expect(res.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Length': '20',
      'Content-Disposition': `attachment; filename="Brosur _PPDB_.pdf"; filename*=UTF-8''Brosur%20%22PPDB%22.pdf`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=300',
    })
    expect(result).toBeInstanceOf(StreamableFile)
    expect(result.getStream()).toBe(stream)
  })
})
