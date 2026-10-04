import { Module } from '@nestjs/common'
import { AgendaModule } from './agenda/agenda.module.js'
import { GalleryModule } from './gallery/gallery.module.js'
import { HomepageModule } from './homepage/homepage.module.js'
import { PortalHtmlModule } from './homepage/portal-html.module.js'
import { MediaModule } from './media/media.module.js'
import { PortalFileUsageModule } from './media/portal-file-usage.module.js'
import { PageModule } from './page/page.module.js'
import { PortalSharedModule } from './shared/portal-shared.module.js'
import { PostModule } from './post/post.module.js'
import { TaxonomyModule } from './taxonomy/taxonomy.module.js'

@Module({
  imports: [
    PostModule,
    HomepageModule,
    TaxonomyModule,
    MediaModule,
    PageModule,
    AgendaModule,
    GalleryModule,
    PortalFileUsageModule,
    PortalSharedModule,
    PortalHtmlModule,
  ],
  exports: [
    PostModule,
    HomepageModule,
    TaxonomyModule,
    MediaModule,
    PageModule,
    AgendaModule,
    GalleryModule,
  ],
})
export class PortalModule {}
