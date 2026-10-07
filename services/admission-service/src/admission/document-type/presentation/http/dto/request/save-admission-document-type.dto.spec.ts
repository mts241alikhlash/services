import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  CreateAdmissionDocumentTypeDto,
  UpdateAdmissionDocumentTypeDto,
} from './save-admission-document-type.dto.js'

async function errorsFor(body: unknown) {
  return (
    await validate(plainToInstance(UpdateAdmissionDocumentTypeDto, body))
  ).map((error) => error.property)
}

describe('UpdateAdmissionDocumentTypeDto', () => {
  it('accepts any subset of the fields', async () => {
    await expect(errorsFor({})).resolves.toEqual([])
    await expect(errorsFor({ isActive: false })).resolves.toEqual([])
    await expect(
      errorsFor({ name: 'Rapor', isRequired: true }),
    ).resolves.toEqual([])
  })

  it.each([
    [{ name: null }, 'name'],
    [{ isRequired: null }, 'isRequired'],
    [{ isActive: null }, 'isActive'],
    [{ name: '' }, 'name'],
  ])('refuses %j', async (body, property) => {
    await expect(errorsFor(body)).resolves.toContain(property)
  })
})

describe('CreateAdmissionDocumentTypeDto', () => {
  it('requires every field', async () => {
    const errors = await validate(
      plainToInstance(CreateAdmissionDocumentTypeDto, {}),
    )
    expect(errors.map((e) => e.property).sort()).toEqual([
      'isActive',
      'isRequired',
      'name',
    ])
  })
})
