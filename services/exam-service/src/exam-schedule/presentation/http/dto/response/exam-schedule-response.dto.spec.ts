import { AccessCodeDto, ExamScheduleDto } from './exam-schedule-response.dto.js'

const view = {
  id: '55555555-5555-4555-8555-555555555555',
  packageId: '66666666-6666-4666-8666-666666666666',
  subjectId: '11111111-1111-4111-8111-111111111111',
  packageTitle: 'UTS',
  classroomId: '77777777-7777-4777-8777-777777777777',
  classroomName: 'VII A',
  semesterId: '88888888-8888-4888-8888-888888888888',
  startsAt: new Date('2026-11-02T01:00:00.000Z'),
  endsAt: new Date('2026-11-02T04:00:00.000Z'),
  durationMinutes: 90,
  type: 'UH' as const,
  kind: 'MAKEUP' as const,
  makeupOfId: '44444444-4444-4444-8444-444444444444',
  tokenRotation: 3,
  status: 'SCHEDULED' as const,
  createdById: '99999999-9999-4999-8999-999999999999',
  createdAt: new Date('2026-10-30T00:00:00.000Z'),
  updatedAt: new Date('2026-10-30T00:00:00.000Z'),
}

describe('exam schedule response DTOs', () => {
  it('never carries an access code or the rotation counter', () => {
    const json = JSON.stringify(ExamScheduleDto.fromDomain(view))

    expect(json).not.toMatch(/access|token|code/iu)
    expect(json).not.toContain('"tokenRotation"')
  })

  it('serialises dates as ISO strings', () => {
    const dto = ExamScheduleDto.fromDomain(view)

    expect(dto.startsAt).toBe('2026-11-02T01:00:00.000Z')
    expect(dto.endsAt).toBe('2026-11-02T04:00:00.000Z')
  })

  it('says whether a schedule is a makeup and of which one', () => {
    const dto = ExamScheduleDto.fromDomain(view)

    expect(dto.kind).toBe('MAKEUP')
    expect(dto.makeupOfId).toBe('44444444-4444-4444-8444-444444444444')
  })

  it('exposes the access code only through AccessCodeDto', () => {
    const dto = AccessCodeDto.of('K7M2QX', 3)

    expect(dto).toEqual({ accessCode: 'K7M2QX', rotation: 3 })
  })
})
