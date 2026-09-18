import { ConflictException } from '@nestjs/common'
import { DayEnum as Day } from '../../../shared/domain/enums/day.enum.js'
import {
  IScheduleRepository,
  ScheduleWithDetails,
} from '../repositories/schedule.repository.js'
import {
  assertSlotIsFree,
  PlannedLesson,
} from './assert-slot-is-free.policy.js'

describe('assertSlotIsFree', () => {
  let mockRepo: jest.Mocked<IScheduleRepository>

  const lesson: PlannedLesson = {
    employeeId: 'tea-1',
    classroomId: 'cls-1',
    semesterId: 'sem-1',
    timeSlotId: 'ts-1',
    day: Day.MONDAY,
  }

  beforeEach(() => {
    mockRepo = {
      findClassroomConflictingSchedule: jest.fn().mockResolvedValue(null),
      findEmployeeConflictingSchedule: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<IScheduleRepository>
  })

  it('allows the lesson when neither classroom nor employee is busy', async () => {
    await expect(assertSlotIsFree(mockRepo, lesson)).resolves.toBeUndefined()
  })

  it('forwards excludeScheduleId to both queries when editing an existing row', async () => {
    await assertSlotIsFree(mockRepo, lesson, 'sch-editing')

    expect(mockRepo.findClassroomConflictingSchedule).toHaveBeenCalledWith(
      'cls-1',
      'sem-1',
      'ts-1',
      Day.MONDAY,
      'sch-editing',
    )
    expect(mockRepo.findEmployeeConflictingSchedule).toHaveBeenCalledWith(
      'tea-1',
      'sem-1',
      'ts-1',
      Day.MONDAY,
      'sch-editing',
    )
  })

  it('refuses the lesson when the classroom already has another subject then', async () => {
    const clash: ScheduleWithDetails = {
      id: 'sch-existing',
      teachingAssignmentId: 'ta-other',
      timeSlotId: 'ts-1',
      day: Day.MONDAY,
      teachingAssignment: {
        id: 'ta-other',
        employeeId: 'tea-2',
        classroomId: 'cls-1',
        subjectId: 'sub-ipa',
        semesterId: 'sem-1',
        subject: { id: 'sub-ipa', code: 'IPA', name: 'IPA' },
        classroom: {
          id: 'cls-1',
          code: '7A',
          name: 'Kelas 7A',
          gradeId: 'grade-1',
          academicYearId: 'ay-1',
          capacity: 30,
        },
      },
      timeSlot: {
        id: 'ts-1',
        name: 'Jam ke-1',
        startTime: new Date(),
        endTime: new Date(),
        order: 1,
        typeId: 'type-1',
      },
    }
    mockRepo.findClassroomConflictingSchedule.mockResolvedValue(clash)

    await expect(assertSlotIsFree(mockRepo, lesson)).rejects.toThrow(
      new ConflictException(
        'Kelas ini sudah ada pelajaran pada jam tersebut: IPA (7A) hari Senin Jam ke-1.',
      ),
    )
  })

  it('refuses the lesson when the employee is already teaching another class then', async () => {
    const clash: ScheduleWithDetails = {
      id: 'sch-existing',
      teachingAssignmentId: 'ta-other-class',
      timeSlotId: 'ts-1',
      day: Day.MONDAY,
      teachingAssignment: {
        id: 'ta-other-class',
        employeeId: 'tea-1',
        classroomId: 'cls-2',
        subjectId: 'sub-mat',
        semesterId: 'sem-1',
        subject: { id: 'sub-mat', code: 'MAT', name: 'Matematika' },
        classroom: {
          id: 'cls-2',
          code: '7B',
          name: 'Kelas 7B',
          gradeId: 'grade-1',
          academicYearId: 'ay-1',
          capacity: 30,
        },
        employee: {
          id: 'tea-1',
          userId: 'user-1',
          nip: '198001012005011001',
          user: {
            id: 'user-1',
            identifier: 'tea-1',
            isActive: true,
            profile: {
              name: 'Pak Budi',
            },
          },
        },
      },
      timeSlot: {
        id: 'ts-1',
        name: 'Jam ke-1',
        startTime: new Date(),
        endTime: new Date(),
        order: 1,
        typeId: 'type-1',
      },
    }
    mockRepo.findEmployeeConflictingSchedule.mockResolvedValue(clash)

    await expect(assertSlotIsFree(mockRepo, lesson)).rejects.toThrow(
      new ConflictException(
        'Pak Budi sudah mengajar pada jam tersebut: Matematika (7B) hari Senin Jam ke-1.',
      ),
    )
  })
})
