import { Module } from '@nestjs/common'
import { AssetModule } from './asset/asset.module.js'
import { ReferenceDataModule } from './reference-data/reference-data.module.js'
import { CirculationModule } from './circulation/circulation.module.js'
import { ApprovalModule } from './approval/approval.module.js'

@Module({
  imports: [
    AssetModule,
    ReferenceDataModule,
    CirculationModule,
    ApprovalModule,
  ],
  exports: [
    AssetModule,
    ReferenceDataModule,
    CirculationModule,
    ApprovalModule,
  ],
})
export class InventoryModule {}
