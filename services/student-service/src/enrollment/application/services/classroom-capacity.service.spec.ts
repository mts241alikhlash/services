import { BadRequestException } from '@nestjs/common'
import { ClassroomCapacityService } from './classroom-capacity.service.js'
import type { IAcademicLookupPort } from '../../../platform/academic-lookup/academic-lookup.port.js'
import type { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.js'

describe('ClassroomCapacityService', () => {
  function serviceWith(capacity: number | null, activeCount: number) {
    const academicLookup = {
      findClassroomDetail: jest
        .fn()
        .mockResolvedValue(
          capacity === null ? null : { id: 'cls-1', capacity },
        ),
    } as unknown as IAcademicLookupPort

    const countActiveByClassroomAndSemester = jest
      .fn()
      .mockResolvedValue(activeCount)
    const enrollmentRepository = {
      countActiveByClassroomAndSemester,
    } as unknown as IEnrollmentRepository

    return {
      service: new ClassroomCapacityService(
        academicLookup,
        enrollmentRepository,
      ),
      countActiveByClassroomAndSemester,
    }
  }

  function assert(service: ClassroomCapacityService, incoming: number) {
    return service.assertRoomFor({
      classroomId: 'cls-1',
      semesterId: 'sem-1',
      incoming,
    })
  }

  it('allows a batch that exactly fills the room', async () => {
    const { service } = serviceWith(30, 28)
    await expect(assert(service, 2)).resolves.toBeUndefined()
  })

  it('refuses a batch that would overshoot, even by one', async () => {
    const { service } = serviceWith(30, 28)
    await expect(assert(service, 3)).rejects.toThrow(BadRequestException)
  })

  it('refuses the second of two batches that were each fine when the page loaded', async () => {
    const first = serviceWith(30, 28)
    await expect(assert(first.service, 2)).resolves.toBeUndefined()

    const second = serviceWith(30, 30)
    await expect(assert(second.service, 2)).rejects.toThrow(BadRequestException)
  })

  it('says how much room there is, not just that it is full', async () => {
    const { service } = serviceWith(30, 28)
    await expect(assert(service, 5)).rejects.toThrow(
      /28 already enrolled, room for 2 more, 5 requested/,
    )
  })

  it('treats capacity 0 as unlimited, as the enrolment path always has', async () => {
    const { service } = serviceWith(0, 500)
    await expect(assert(service, 100)).resolves.toBeUndefined()
  })

  it('does not block when the classroom cannot be found', async () => {
    const { service } = serviceWith(null, 0)
    await expect(assert(service, 1)).resolves.toBeUndefined()
  })

  it('does not query at all when nobody is arriving', async () => {
    const { service, countActiveByClassroomAndSemester } = serviceWith(30, 30)

    await expect(assert(service, 0)).resolves.toBeUndefined()
    expect(countActiveByClassroomAndSemester).not.toHaveBeenCalled()
  })
})
