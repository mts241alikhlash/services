import { AdmissionAdminRegistrationController } from './admission-admin-registration.controller.js'

describe('AdmissionAdminRegistrationController.register', () => {
  it('forwards the admission type and the target grade', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: 'a1',
      registrationNumber: 'G1-0001',
      identifier: 'a@b.c',
    })
    const controller = new AdmissionAdminRegistrationController(
      { execute } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    )

    await controller.register({
      fullName: 'Ahmad',
      email: 'a@b.c',
      password: 'rahasia123',
      passwordConfirm: 'rahasia123',
      waveId: 'w1',
      admissionType: 'NEW',
      targetGradeId: 'g7',
    })

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ admissionType: 'NEW', targetGradeId: 'g7' }),
    )
  })
})
