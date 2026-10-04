import { Global, Module } from '@nestjs/common'
import { IFileUsageChecker } from '../../platform/file/domain/interfaces/file-usage-checker.interface.js'
import { PortalFileUsageChecker } from './infrastructure/portal-file-usage.checker.js'
import { MediaModule } from './media.module.js'

@Global()
@Module({
  imports: [MediaModule],
  providers: [{ provide: IFileUsageChecker, useClass: PortalFileUsageChecker }],
  exports: [IFileUsageChecker],
})
export class PortalFileUsageModule {}
