import { IS_PUBLIC_KEY } from '../../../../core/decorators/public.decorator.js'
import { AdmissionPublicController } from './admission-public.controller.js'

describe('AdmissionPublicController', () => {
  it('serves the grade list without a token', async () => {
    const getActiveGrades = {
      execute: jest
        .fn()
        .mockResolvedValue([{ id: 'g7', level: 7, name: 'Kelas 7' }]),
    }
    const controller = new AdmissionPublicController(
      {} as never,
      {} as never,
      getActiveGrades as never,
    )

    expect(
      Reflect.getMetadata(
        IS_PUBLIC_KEY,
        AdmissionPublicController.prototype.grades,
      ),
    ).toBe(true)
    await expect(controller.grades()).resolves.toMatchObject({
      data: [{ id: 'g7', level: 7, name: 'Kelas 7' }],
    })
  })

  it('forwards the admission type and the target grade to registration', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: 'a1',
      registrationNumber: 'G1-0001',
      identifier: 'a@b.c',
    })
    const controller = new AdmissionPublicController(
      {} as never,
      { execute } as never,
      {} as never,
    )

    await controller.register({
      fullName: 'Ahmad',
      email: 'a@b.c',
      password: 'rahasia123',
      passwordConfirm: 'rahasia123',
      admissionType: 'TRANSFER',
      targetGradeId: 'g8',
    })

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        admissionType: 'TRANSFER',
        targetGradeId: 'g8',
      }),
    )
  })
})
