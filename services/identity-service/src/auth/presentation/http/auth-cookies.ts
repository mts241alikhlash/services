import type { CookieOptions } from 'express'

export function appCookieName(isProduction: boolean): string {
  return isProduction ? '__Host-refresh_token' : 'refresh_token'
}

export function centralCookieName(isProduction: boolean): string {
  return isProduction ? '__Host-sso_session' : 'sso_session'
}

export function sessionCookieOptions(
  isProduction: boolean,
  maxAge?: number,
): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    ...(maxAge !== undefined && { maxAge }),
  }
}
