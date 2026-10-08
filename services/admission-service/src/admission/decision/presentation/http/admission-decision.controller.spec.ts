import { AdmissionDecisionController } from './admission-decision.controller.js'

describe('AdmissionDecisionController.acceptMany', () => {
  function setup() {
    const acceptMany = { execute: jest.fn().mockResolvedValue({ results: [] }) }
    const controller = new AdmissionDecisionController(
      {} as never,
      {} as never,
      {} as never,
      acceptMany as never,
      {} as never,
      {} as never,
    )
    return { controller, acceptMany }
  }
  const user = { id: 'admin1' } as never

  it('trims the shared note and drops a blank one', async () => {
    const { controller, acceptMany } = setup()

    await controller.acceptMany(user, {
      applicationIds: ['a'],
      note: ' Selamat ',
    })
    await controller.acceptMany(user, { applicationIds: ['a'], note: '   ' })

    expect(acceptMany.execute).toHaveBeenNthCalledWith(1, {
      applicationIds: ['a'],
      note: 'Selamat',
      adminId: 'admin1',
    })
    expect(acceptMany.execute).toHaveBeenNthCalledWith(2, {
      applicationIds: ['a'],
      note: undefined,
      adminId: 'admin1',
    })
  })
})
