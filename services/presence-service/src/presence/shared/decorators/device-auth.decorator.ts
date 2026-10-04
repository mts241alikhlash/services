import { applyDecorators, SetMetadata } from '@nestjs/common'
import { Public } from '../../../core/decorators/public.decorator.js'

export const IS_DEVICE_AUTH_KEY = 'isDeviceAuth'

export const DeviceAuth = () =>
  applyDecorators(Public(), SetMetadata(IS_DEVICE_AUTH_KEY, true))
