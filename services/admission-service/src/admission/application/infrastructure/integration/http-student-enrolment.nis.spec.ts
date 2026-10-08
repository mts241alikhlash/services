import { HttpException, InternalServerErrorException } from '@nestjs/common'
import { HttpStudentEnrolmentAdapter } from './http-student-enrolment.adapter.js'

function adapter(url: string | undefined = 'http://student:3900/') {
  return new HttpStudentEnrolmentAdapter({ get: () => url } as never)
}

describe('HttpStudentEnrolmentAdapter.updateNis', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
  })

  it('patches the student with the caller token', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    global.fetch = fetchMock as never

    await adapter().updateNis('s1', '262707001', 'tok')

    expect(fetchMock).toHaveBeenCalledWith('http://student:3900/students/s1', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer tok',
      },
      body: JSON.stringify({ nis: '262707001' }),
    })
  })

  it('surfaces the refusal with its status and message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: 'Duplicate NIS or NISN' }),
    }) as never

    await expect(adapter().updateNis('s1', '1', 'tok')).rejects.toMatchObject({
      status: 409,
      message: 'Duplicate NIS or NISN',
    })
    await expect(adapter().updateNis('s1', '1', 'tok')).rejects.toBeInstanceOf(
      HttpException,
    )
  })

  it('answers a clear error when student-service is unreachable or not configured', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('refused')) as never
    await expect(adapter().updateNis('s1', '1', 'tok')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    )
    await expect(
      adapter(undefined).updateNis('s1', '1', 'tok'),
    ).rejects.toBeInstanceOf(InternalServerErrorException)
  })
})
