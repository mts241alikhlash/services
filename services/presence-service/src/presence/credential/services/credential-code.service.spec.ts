import { Test, TestingModule } from '@nestjs/testing'
import { CredentialCodeService } from './credential-code.service.js'

describe('CredentialCodeService', () => {
  let service: CredentialCodeService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CredentialCodeService],
    }).compile()

    service = module.get(CredentialCodeService)
  })

  it('produces a URL-safe code that survives being typed into a kiosk field', () => {
    expect(service.generate()).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('carries 128 bits of entropy', () => {
    expect(service.generate()).toHaveLength(22)
  })

  it('is not enumerable — 1000 codes collide zero times and share no prefix', () => {
    const codes = Array.from({ length: 1000 }, () => service.generate())

    expect(new Set(codes).size).toBe(1000)
    expect(new Set(codes.map((c) => c.slice(0, 4))).size).toBeGreaterThan(900)
  })

  it('takes nothing about the holder, so it can encode nothing about them', () => {
    expect(service.generate).toHaveLength(0)
  })

  it('draws again for the same holder rather than deriving twice', () => {
    expect(service.generate()).not.toBe(service.generate())
  })
})
