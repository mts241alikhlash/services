import { ConfigService } from '@nestjs/config'
import { HttpStudentEnrolmentAdapter } from './http-student-enrolment.adapter.js'
import type { EnrolStudentInput } from './student-enrolment.port.js'

describe('HttpStudentEnrolmentAdapter', () => {
  it('forwards applicationId without changing the response contract', async () => {
    const config = {
      get: jest.fn().mockReturnValue('http://student-service/'),
    } as unknown as ConfigService
    const responseBody = {
      data: {
        studentId: 'student-1',
        parentsLinked: 0,
        enrollmentCreated: false,
        alreadyEnrolled: false,
      },
    }
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(responseBody),
    } as unknown as Response)

    const input: EnrolStudentInput = {
      applicationId: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
      nis: '2026001',
      nisn: '0101234567',
      profile: {
        name: 'Siti',
        nik: '3204014504100002',
        gender: 'FEMALE',
        birthPlace: 'Bandung',
        birthDate: '2010-04-05',
      },
    }

    await expect(
      new HttpStudentEnrolmentAdapter(config).enrol(input, 'token'),
    ).resolves.toEqual(responseBody.data)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://student-service/students/enrol',
      expect.objectContaining({ body: JSON.stringify(input) }),
    )

    fetchMock.mockRestore()
  })
})
