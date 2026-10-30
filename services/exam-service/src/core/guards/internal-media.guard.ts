import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Request } from 'express'

/**
 * Guards the MediaMTX auth hook.
 *
 * MediaMTX's `authHTTPAddress` cannot send custom headers, so the shared
 * provisioning token is not usable here. What isolates the route instead:
 *
 * - any request carrying `X-Forwarded-For` came through the public gateway, and
 *   the gateway sets that header on every proxied location, so it is refused;
 * - the route is not in any routing manifest, so nothing maps it publicly.
 *
 * The actual authorisation is the publish token itself, checked by
 * `CheckStreamTokenUseCase`: signature, nonce, session status and path.
 */
@Injectable()
export class InternalMediaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    if (request.headers['x-forwarded-for'] !== undefined) {
      throw new NotFoundException()
    }
    return true
  }
}
