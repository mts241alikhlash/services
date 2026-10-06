import { PrismaAdmissionApplicantReader } from './prisma-admission-applicant.reader.js'

function makeReader(filled: Record<string, number>) {
  const prisma = {
    admissionWave: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'w1', quota: 2, startDate: new Date('2027-01-01') },
        { id: 'w2', quota: 2, startDate: new Date('2027-02-01') },
      ]),
    },
    admissionApplication: {
      groupBy: jest.fn().mockResolvedValue(
        Object.entries(filled).map(([waveId, n]) => ({
          waveId,
          _count: { _all: n },
        })),
      ),
    },
  }
  return new PrismaAdmissionApplicantReader(prisma as never, {} as never)
}

describe('PrismaAdmissionApplicantReader.findActiveWave', () => {
  it('skips a full wave', async () => {
    const wave = await makeReader({ w1: 2 }).findActiveWave()
    expect(wave?.id).toBe('w2')
  })

  it('returns to a wave once a seat frees up', async () => {
    const wave = await makeReader({ w1: 1 }).findActiveWave()
    expect(wave?.id).toBe('w1')
  })

  it('returns null when every open wave is full', async () => {
    expect(await makeReader({ w1: 2, w2: 2 }).findActiveWave()).toBeNull()
  })
})
