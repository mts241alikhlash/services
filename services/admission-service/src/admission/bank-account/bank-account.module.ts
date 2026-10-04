import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { AdmissionBankAccountController } from './presentation/http/admission-bank-account.controller.js'
import { PrismaAdmissionBankAccountRepository } from './infrastructure/persistence/prisma/prisma-admission-bank-account.repository.js'
import { IAdmissionBankAccountRepository } from './domain/repositories/admission-bank-account-repository.js'
import { GetBankAccountsUseCase } from './application/use-cases/get-bank-accounts/get-bank-accounts.use-case.js'
import { SaveBankAccountUseCase } from './application/use-cases/save-bank-account/save-bank-account.use-case.js'
import { DeleteBankAccountUseCase } from './application/use-cases/delete-bank-account/delete-bank-account.use-case.js'

@Module({
  imports: [AuthModule],
  controllers: [AdmissionBankAccountController],
  providers: [
    {
      provide: IAdmissionBankAccountRepository,
      useClass: PrismaAdmissionBankAccountRepository,
    },
    GetBankAccountsUseCase,
    SaveBankAccountUseCase,
    DeleteBankAccountUseCase,
  ],
  exports: [IAdmissionBankAccountRepository, GetBankAccountsUseCase],
})
export class BankAccountModule {}
