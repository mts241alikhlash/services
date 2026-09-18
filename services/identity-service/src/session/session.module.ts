import { Module } from '@nestjs/common'
import { SessionController } from './presentation/http/session.controller.js'
import { GetUserSessionsUseCase } from './application/use-cases/get-user-sessions/get-user-sessions.use-case.js'
import { RevokeSessionUseCase } from './application/use-cases/revoke-session/revoke-session.use-case.js'
import { RevokeAllSessionsUseCase } from './application/use-cases/revoke-all-sessions/revoke-all-sessions.use-case.js'
import { UserModule } from '../user/user.module.js'
import { AuthModule } from '../auth/auth.module.js'

@Module({
  imports: [UserModule, AuthModule],
  controllers: [SessionController],
  providers: [
    GetUserSessionsUseCase,
    RevokeSessionUseCase,
    RevokeAllSessionsUseCase,
  ],
})
export class SessionModule {}
