import { SemesterResponseDto } from './semester-response.dto.js'

describe('SemesterResponseDto', () => {
  it('keeps the enrolment count the rollover suggestion reads', () => {
    const dto = SemesterResponseDto.fromDomain({
      id: 'sem-1',
      academicYearId: 'ay-1',
      typeId: 'type-1',
      isActive: true,
      type: { id: 'type-1', name: 'Ganjil', sequence: 1 },
      academicYear: { id: 'ay-1', name: '2026/2027' },
      _count: { enrollments: 120, teachingAssignments: 14 },
    } as never)

    expect(dto._count).toEqual({ enrollments: 120, teachingAssignments: 14 })
    expect(dto.type.sequence).toBe(1)
  })
})
