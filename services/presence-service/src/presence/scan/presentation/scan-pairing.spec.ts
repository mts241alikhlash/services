import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'
import { DEVICE_TOKEN_COOKIE } from '../../shared/constants/presence.constants.js'
import { ScanController } from './scan.controller.js'

function controllerIn(nodeEnv: string) {
  return new ScanController(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    new ConfigService({ NODE_ENV: nodeEnv }),
  )
}

function response() {
  return { cookie: jest.fn(), clearCookie: jest.fn() }
}

describe('kiosk pairing', () => {
  it('keeps the device token in an HttpOnly cookie the page cannot read', () => {
    const res = response()

    controllerIn('production').pair(
      { headers: { authorization: 'Bearer gate-token' } },
      res as unknown as Response,
    )

    expect(res.cookie).toHaveBeenCalledWith(DEVICE_TOKEN_COOKIE, 'gate-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/presence/scans',
      maxAge: 400 * 24 * 60 * 60 * 1000,
    })
  })

  it('drops Secure only outside production, for http on localhost', () => {
    const res = response()

    controllerIn('development').pair(
      { headers: { authorization: 'Bearer gate-token' } },
      res as unknown as Response,
    )

    expect(res.cookie).toHaveBeenCalledWith(
      DEVICE_TOKEN_COOKIE,
      'gate-token',
      expect.objectContaining({ secure: false }),
    )
  })

  it('forgets the device on unpair', () => {
    const res = response()

    controllerIn('production').unpair(res as unknown as Response)

    expect(res.clearCookie).toHaveBeenCalledWith(DEVICE_TOKEN_COOKIE, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/presence/scans',
    })
  })
})
