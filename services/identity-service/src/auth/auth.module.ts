import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'
import { AuthController } from './presentation/http/auth.controller.js'
import { PrismaAuthRepository } from './infrastructure/persistence/prisma/prisma-auth.repository.js'
import { IAuthRepository } from './domain/repositories/auth.repository.js'
import { AuthCleanupService } from './application/services/auth-cleanup.service.js'
import { TokenManagerService } from './application/services/token-manager.service.js'
import { PasswordManagerService } from './application/services/password-manager.service.js'
import { AuthSessionService } from './application/services/auth-session.service.js'
import { JwtStrategy } from './strategies/jwt.strategy.js'
import { GoogleStrategy } from './strategies/google.strategy.js'
import { GoogleAuthGuard } from './guards/google-auth.guard.js'
import { GetProfileUseCase } from './application/use-cases/get-profile/get-profile.use-case.js'
import { LoginUseCase } from './application/use-cases/login/login.use-case.js'
import { OAuthLoginUseCase } from './application/use-cases/oauth-login/oauth-login.use-case.js'
import { LogoutUseCase } from './application/use-cases/logout/logout.use-case.js'
import { RefreshTokenUseCase } from './application/use-cases/refresh-token/refresh-token.use-case.js'
import { ValidateTokenUseCase } from './application/use-cases/validate-token/validate-token.use-case.js'
import { IntrospectTokenUseCase } from './application/use-cases/introspect-token/introspect-token.use-case.js'
import { ChangePasswordUseCase } from './application/use-cases/change-password/change-password.use-case.js'
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset/request-password-reset.use-case.js'
import { ResetPasswordUseCase } from './application/use-cases/reset-password/reset-password.use-case.js'
import { NotificationModule } from '../notification/notification.module.js'

@Module({
  imports: [
    NotificationModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: IAuthRepository,
      useClass: PrismaAuthRepository,
    },

    TokenManagerService,
    PasswordManagerService,
    AuthCleanupService,
    AuthSessionService,

    LoginUseCase,
    OAuthLoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GetProfileUseCase,
    ValidateTokenUseCase,
    IntrospectTokenUseCase,
    ChangePasswordUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,

    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    GoogleAuthGuard,
  ],
  exports: [
    TokenManagerService,
    PasswordManagerService,
    JwtAuthGuard,
    ValidateTokenUseCase,
    AuthSessionService,
  ],
})
export class AuthModule {}
