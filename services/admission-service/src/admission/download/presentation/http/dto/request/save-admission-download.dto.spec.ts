import { BadRequestException, ValidationPipe } from '@nestjs/common'
import {
  CreateAdmissionDownloadDto,
  UpdateAdmissionDownloadDto,
} from './save-admission-download.dto.js'

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
})

const parse = <T>(metatype: new () => T, body: Record<string, unknown>) =>
  pipe.transform(body, { type: 'body', metatype }) as Promise<T>

describe('multipart download fields', () => {
  it.each([
    ['false', false],
    ['true', true],
  ])('reads isActive "%s" as %s on create', async (raw, expected) => {
    const dto = await parse(CreateAdmissionDownloadDto, {
      title: 'Brosur',
      isActive: raw,
    })
    expect(dto.isActive).toBe(expected)
  })

  it('reads isActive "false" as false on update', async () => {
    const dto = await parse(UpdateAdmissionDownloadDto, { isActive: 'false' })
    expect(dto.isActive).toBe(false)
  })

  it('leaves isActive unset when the field is absent', async () => {
    const dto = await parse(UpdateAdmissionDownloadDto, { title: 'Baru' })
    expect(dto.isActive).toBeUndefined()
  })

  it('refuses an isActive that is not a boolean', async () => {
    await expect(
      parse(CreateAdmissionDownloadDto, { title: 'Brosur', isActive: 'maybe' }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('keeps an empty description so it can clear the old one', async () => {
    const dto = await parse(UpdateAdmissionDownloadDto, { description: '' })
    expect(dto.description).toBe('')
  })
})
