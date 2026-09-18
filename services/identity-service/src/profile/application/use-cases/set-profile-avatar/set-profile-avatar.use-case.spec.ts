import {
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  BadRequestException,
} from '@nestjs/common'
import { SetProfileAvatarUseCase } from './set-profile-avatar.use-case.js'

const profile = { id: 'p-1' }

function build(replacedKey: string | null = null) {
  const repository = {
    setAvatar: jest.fn().mockResolvedValue({ profile, replacedKey }),
  }
  const storage = {
    uploadFile: jest.fn().mockResolvedValue('key'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  }
  const useCase = new SetProfileAvatarUseCase(
    repository as never,
    storage as never,
  )
  return { useCase, repository, storage }
}

const file = (over: Partial<Express.Multer.File> = {}) =>
  ({
    buffer: Buffer.from('x'),
    originalname: 'me.png',
    mimetype: 'image/png',
    size: 1024,
    ...over,
  }) as Express.Multer.File

describe('SetProfileAvatarUseCase', () => {
  it('refuses a type a browser cannot safely render as an image', async () => {
    const { useCase, storage } = build()
    await expect(
      useCase.execute('u-1', file({ mimetype: 'image/svg+xml' })),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException)
    expect(storage.uploadFile).not.toHaveBeenCalled()
  })

  it('refuses anything over 2 MB before it reaches storage', async () => {
    const { useCase, storage } = build()
    await expect(
      useCase.execute('u-1', file({ size: 2 * 1024 * 1024 + 1 })),
    ).rejects.toBeInstanceOf(PayloadTooLargeException)
    expect(storage.uploadFile).not.toHaveBeenCalled()
  })

  it('refuses an empty upload', async () => {
    const { useCase } = build()
    await expect(
      useCase.execute('u-1', file({ buffer: Buffer.alloc(0) })),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('writes the object first, so a failed record never leaves a dangling row', async () => {
    const { useCase, repository, storage } = build()
    await useCase.execute('u-1', file())

    const uploadOrder = storage.uploadFile.mock.invocationCallOrder[0]
    const recordOrder = repository.setAvatar.mock.invocationCallOrder[0]
    expect(uploadOrder).toBeLessThan(recordOrder)
  })

  it('keys the object by user, so two people never collide', async () => {
    const { useCase, storage } = build()
    await useCase.execute('u-1', file())
    expect(storage.uploadFile.mock.calls[0][1]).toMatch(
      /^profiles\/avatars\/u-1\/[0-9a-f-]{36}\.png$/,
    )
  })

  it('removes the photo it replaced', async () => {
    const { useCase, storage } = build('profiles/avatars/u-1/old.png')
    await useCase.execute('u-1', file())
    expect(storage.deleteFile).toHaveBeenCalledWith(
      'profiles/avatars/u-1/old.png',
    )
  })

  it('still succeeds when the old object is already gone', async () => {
    const { useCase, storage } = build('profiles/avatars/u-1/old.png')
    storage.deleteFile.mockRejectedValue(new Error('NoSuchKey'))
    await expect(useCase.execute('u-1', file())).resolves.toBe(profile)
  })
})
