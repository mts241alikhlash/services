import {
  BadRequestException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common'
import type { Request } from 'express'

export const DeviceId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const value = context.switchToHttp().getRequest<Request>().headers[
      'x-device-id'
    ]
    if (
      typeof value !== 'string' ||
      value.trim() === '' ||
      value.length > 100
    ) {
      throw new BadRequestException('Header X-Device-Id wajib diisi')
    }
    return value
  },
)
