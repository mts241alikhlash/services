import type { ExecutionContext } from '@nestjs/common'

export function onlyWhereDeclared(name: string) {
  const key = `THROTTLER:LIMIT${name}`
  return (context: ExecutionContext): boolean =>
    ![context.getHandler(), context.getClass()].some((target) =>
      Reflect.hasMetadata(key, target),
    )
}
