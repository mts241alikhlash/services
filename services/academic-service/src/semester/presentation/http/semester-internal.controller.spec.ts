import { Test } from '@nestjs/testing'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { ISemesterRepository } from '../../domain/repositories/semester.repository.js'
import { SemesterInternalController } from './semester-internal.controller.js'

describe('SemesterInternalController dates', () => {
  const findAll = jest.fn()
  let controller: SemesterInternalController

  beforeEach(async () => {
    findAll.mockReset()
    const module = await Test.createTestingModule({
      controllers: [SemesterInternalController],
      providers: [{ provide: ISemesterRepository, useValue: { findAll } }],
    })
      .overrideGuard(ProvisioningTokenGuard)
      .useValue({ canActivate: () => true })
      .compile()
    controller = module.get(SemesterInternalController)
  })

  it('returns the semester dates as ISO dates, null when unset', async () => {
    findAll.mockResolvedValue({
      data: [
        {
          id: 's1',
          academicYearId: 'y1',
          startDate: new Date('2026-07-13T00:00:00.000Z'),
          endDate: new Date('2026-12-19T00:00:00.000Z'),
          type: { id: 't1', name: 'Ganjil', sequence: 1 },
        },
        {
          id: 's2',
          academicYearId: 'y1',
          startDate: null,
          endDate: null,
          type: { id: 't2', name: 'Genap', sequence: 2 },
        },
      ],
    })

    const result = await controller.byAcademicYear('y1')

    expect(result.data.map((semester) => semester.sequence)).toEqual([2, 1])
    const first = result.data.find((semester) => semester.sequence === 1)
    expect(first?.startDate).toBe('2026-07-13')
    expect(first?.endDate).toBe('2026-12-19')
    const second = result.data.find((semester) => semester.sequence === 2)
    expect(second?.startDate).toBeNull()
    expect(second?.endDate).toBeNull()
  })
})
