import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { timingSafeEqual } from 'node:crypto'
import type { Request } from 'express'

const TOKEN_HEADER = 'x-provisioning-token'

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

@Injectable()
export class ProvisioningTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const provided = request.headers[TOKEN_HEADER]
    const expected = this.config.get<string>('PROVISIONING_SERVICE_TOKEN')

    if (
      typeof provided !== 'string' ||
      !expected ||
      !safeEqual(provided, expected)
    ) {
      throw new UnauthorizedException('Missing or invalid provisioning token.')
    }

    return true
  }
}
