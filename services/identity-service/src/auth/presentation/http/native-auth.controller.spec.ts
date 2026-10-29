import 'reflect-metadata'
import { IS_PUBLIC_KEY } from '../../../core/decorators/public.decorator.js'
import { NativeAuthController } from './native-auth.controller.js'

describe('NativeAuthController', () => {
  it('is public: the tablet has no session before it signs in', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, NativeAuthController)).toBe(true)
  })

  it('has exactly login, refresh and logout', () => {
    const routes = Object.getOwnPropertyNames(NativeAuthController.prototype)
      .filter((name) => name !== 'constructor')
      .sort()

    expect(routes).toEqual(['login', 'logout', 'refresh'])
  })
})
