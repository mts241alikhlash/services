import { Module } from '@nestjs/common'
import { SIMPLE_LISTS } from './lists.js'
import { SimpleListModule } from './simple-list/simple-list.module.js'

@Module({
  imports: SIMPLE_LISTS.map((definition) =>
    SimpleListModule.forList(definition),
  ),
})
export class ReferenceListsModule {}
