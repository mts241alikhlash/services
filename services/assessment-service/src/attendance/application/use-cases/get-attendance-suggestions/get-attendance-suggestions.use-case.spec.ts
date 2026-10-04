import { Test, TestingModule } from '@nestjs/testing'
import { IDailyPresenceReadPort } from '../../../../platform/presence-lookup/presence-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { GetAttendanceSuggestionsUseCase } from './get-attendance-suggestions.use-case.js'

const CLASSROOM_ID = '33333333-3333-4333-8333-333333333333'
const SEMESTER_ID = '44444444-4444-4444-8444-444444444444'

function enrollment(id: string, userId: string | null) {
  return {
    id,
    studentId: `s-${id}`,
    classroomId: 'class-1',
    semesterId: 'sem-1',
    status: 'ACTIVE',
    studentUserId: userId,
    studentNis: null,
    studentName: null,
  }
}

const INPUT = {
  classroomId: CLASSROOM_ID,
  semesterId: SEMESTER_ID,
  date: '2026-08-10',
}

describe('GetAttendanceSuggestionsUseCase', () => {
  let useCase: GetAttendanceSuggestionsUseCase
  const enrollments = { listByClassroom: jest.fn() }
  const presence = { findByUsersAndDate: jest.fn(), summariseMonth: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAttendanceSuggestionsUseCase,
        { provide: IEnrollmentLookupPort, useValue: enrollments },
        { provide: IDailyPresenceReadPort, useValue: presence },
      ],
    }).compile()

    useCase = module.get(GetAttendanceSuggestionsUseCase)
    jest.clearAllMocks()
    enrollments.listByClassroom.mockResolvedValue([
      enrollment('enr-1', 'user-1'),
      enrollment('enr-2', 'user-2'),
      enrollment('enr-3', 'user-3'),
    ])
    presence.findByUsersAndDate.mockResolvedValue([
      {
        userId: 'user-1',
        status: 'PRESENT',
        checkInAt: new Date('2026-08-10T06:55:00.000Z'),
        lateMinutes: 0,
      },
      {
        userId: 'user-2',
        status: 'LATE',
        checkInAt: new Date('2026-08-10T07:25:00.000Z'),
        lateMinutes: 15,
      },
    ])
  })

  it('maps the gate onto enrolments, which is what the class screen works in', async () => {
    const result = await useCase.execute(INPUT)

    expect(result.suggestions).toEqual([
      expect.objectContaining({
        enrollmentId: 'enr-1',
        suggestedStatus: 'PRESENT',
      }),
      expect.objectContaining({
        enrollmentId: 'enr-2',
        suggestedStatus: 'LATE',
        lateMinutes: 15,
      }),
    ])
  })

  it('lists unscanned enrolments separately rather than marking them absent', async () => {
    const result = await useCase.execute(INPUT)

    expect(result.unscannedEnrollmentIds).toEqual(['enr-3'])
  })

  it('carries the actual arrival time through', async () => {
    const result = await useCase.execute(INPUT)

    expect(result.suggestions[1]?.checkInAt).toEqual(
      new Date('2026-08-10T07:25:00.000Z'),
    )
  })

  it('suggests nothing for a day status that is not an arrival', async () => {
    presence.findByUsersAndDate.mockResolvedValue([
      { userId: 'user-1', status: 'ON_LEAVE', checkInAt: null, lateMinutes: 0 },
      { userId: 'user-2', status: 'ABSENT', checkInAt: null, lateMinutes: 0 },
      {
        userId: 'user-3',
        status: 'NOT_EXPECTED',
        checkInAt: null,
        lateMinutes: 0,
      },
    ])

    const result = await useCase.execute(INPUT)

    expect(result.suggestions).toEqual([])
    expect(result.unscannedEnrollmentIds).toHaveLength(3)
  })

  it('ignores a gate record for somebody not in this class', async () => {
    presence.findByUsersAndDate.mockResolvedValue([
      {
        userId: 'stranger',
        status: 'PRESENT',
        checkInAt: null,
        lateMinutes: 0,
      },
    ])

    const result = await useCase.execute(INPUT)

    expect(result.suggestions).toEqual([])
  })

  it('asks presence only about the users actually enrolled', async () => {
    await useCase.execute(INPUT)

    expect(presence.findByUsersAndDate).toHaveBeenCalledWith(
      ['user-1', 'user-2', 'user-3'],
      new Date('2026-08-10'),
    )
  })

  it('exposes no way to write a per-lesson record', async () => {
    await useCase.execute(INPUT)

    expect(Object.keys(presence)).toEqual([
      'findByUsersAndDate',
      'summariseMonth',
    ])
  })

  describe('when presence is unavailable', () => {
    beforeEach(() => {
      presence.findByUsersAndDate.mockRejectedValue(new Error('presence down'))
    })

    it('returns every enrolment as needing a decision rather than throwing', async () => {
      const result = await useCase.execute(INPUT)

      expect(result.suggestions).toEqual([])
      expect(result.unscannedEnrollmentIds).toEqual(['enr-1', 'enr-2', 'enr-3'])
    })

    it('says so, so the screen can explain itself', async () => {
      const result = await useCase.execute(INPUT)

      expect(result.available).toBe(false)
    })
  })

  it('reports availability on the happy path', async () => {
    await expect(useCase.execute(INPUT)).resolves.toEqual(
      expect.objectContaining({ available: true }),
    )
  })

  it('handles an enrolment with no linked user without crashing', async () => {
    enrollments.listByClassroom.mockResolvedValue([enrollment('enr-1', null)])

    const result = await useCase.execute(INPUT)

    expect(result.suggestions).toEqual([])
    expect(result.unscannedEnrollmentIds).toEqual([])
  })
})
