import type { ExecutionContext } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { onlyWhereDeclared } from './only-where-declared.js'

class Routes {
  @Throttle({ auth: {} })
  login() {
    return 'login'
  }

  me() {
    return 'me'
  }
}

@Throttle({ auth: {} })
class GuardedRoutes {
  reset() {
    return 'reset'
  }
}

function contextFor(
  classRef: new () => object,
  handler: () => void,
): ExecutionContext {
  return {
    getClass: () => classRef,
    getHandler: () => handler,
  } as unknown as ExecutionContext
}

describe('onlyWhereDeclared', () => {
  const skip = onlyWhereDeclared('auth')

  it('applies a named limit to a route that declares it', () => {
    expect(skip(contextFor(Routes, Routes.prototype.login))).toBe(false)
  })

  it('applies a named limit to every route of a class that declares it', () => {
    expect(skip(contextFor(GuardedRoutes, GuardedRoutes.prototype.reset))).toBe(
      false,
    )
  })

  it('leaves every other route out of the named limit', () => {
    expect(skip(contextFor(Routes, Routes.prototype.me))).toBe(true)
  })
})
