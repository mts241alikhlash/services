import { Module } from '@nestjs/common'
import { HomepageModule } from './homepage.module.js'
import { PortalHtmlController } from './presentation/portal-html.controller.js'

@Module({
  imports: [HomepageModule],
  controllers: [PortalHtmlController],
})
export class PortalHtmlModule {}
