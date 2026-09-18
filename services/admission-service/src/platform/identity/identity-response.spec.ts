import { ServiceUnavailableException } from '@nestjs/common'
import { parseIdentityResponse } from './identity-response.js'

describe('Identity response contract', () => {
  it('accepts explicit inactive responses', () => {
    expect(parseIdentityResponse({ data: { active: false } })).toBeNull()
  })

  it.each([
    null,
    {},
    { data: {} },
    { data: { active: 'true' } },
    { data: { active: true, userId: 'one' } },
    { data: { active: true, userId: 'one', identifier: 'a', sessionId: '' } },
    {
      data: {
        active: true,
        userId: 'one',
        identifier: 'a',
        sessionId: 's',
        roles: [1],
        permissions: [],
      },
    },
  ])('refuses malformed responses: %j', (body) => {
    expect(() => parseIdentityResponse(body)).toThrow(
      ServiceUnavailableException,
    )
  })

  it('accepts appended fields without exposing them', () => {
    expect(
      parseIdentityResponse({
        data: {
          active: true,
          userId: 'one',
          identifier: 'author',
          sessionId: 'session',
          roles: [],
          permissions: [],
          extra: 'ignored',
        },
      }),
    ).toEqual({
      userId: 'one',
      identifier: 'author',
      sessionId: 'session',
      roles: [],
      permissions: [],
    })
  })
})
