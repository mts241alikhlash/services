import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface OriginRequest {
  headers: Record<string, string | string[] | undefined>
}

@Injectable()
export class SameOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const { headers } = context.switchToHttp().getRequest<OriginRequest>()
    const origin = headers.origin
    const host = headers.host
    if (
      typeof origin === 'string' &&
      typeof host === 'string' &&
      this.allowed(origin, host)
    ) {
      return true
    }
    throw new ForbiddenException('Cross-origin request refused')
  }

  private allowed(origin: string, host: string): boolean {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      return origin === `https://${host}`
    }
    const listed = [
      ...(this.config.get<string>('FRONTEND_URL') ?? '').split(','),
      this.config.get<string>('SSO_ACCOUNTS_ORIGIN') ?? '',
    ]
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
    return origin === `http://${host}` || listed.includes(origin)
  }
}
