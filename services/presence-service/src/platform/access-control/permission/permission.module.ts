import { Module } from '@nestjs/common'
import { PermissionGuard } from './guards/permission.guard.js'

@Module({
  providers: [PermissionGuard],
  exports: [PermissionGuard],
})
export class PermissionModule {}
