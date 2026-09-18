import { forwardRef, Module } from '@nestjs/common'
import { AssetModule } from '../asset/asset.module.js'
import { CirculationModule } from '../circulation/circulation.module.js'
import { StatusModule } from '../reference-data/status/status.module.js'
import { PrismaApprovalRepository } from './infrastructure/persistence/prisma/prisma-approval.repository.js'
import { IApprovalRepository } from './domain/repositories/approval.repository.js'
import { IApprovalCapabilityPort } from './domain/repositories/approval.repository.js'
import { CreateWorkflowUseCase } from './application/use-cases/create-workflow/create-workflow.use-case.js'
import { GetWorkflowsUseCase } from './application/use-cases/get-workflows/get-workflows.use-case.js'
import { GetWorkflowByIdUseCase } from './application/use-cases/get-workflow-by-id/get-workflow-by-id.use-case.js'
import { GetPendingApprovalsUseCase } from './application/use-cases/get-pending-approvals/get-pending-approvals.use-case.js'
import { ProcessApprovalUseCase } from './application/use-cases/process-approval/process-approval.use-case.js'
import { WorkflowController } from './presentation/http/workflow.controller.js'
import { ApprovalController } from './presentation/http/approval.controller.js'

@Module({
  imports: [
    forwardRef(() => AssetModule),
    forwardRef(() => CirculationModule),
    StatusModule,
  ],
  controllers: [WorkflowController, ApprovalController],
  providers: [
    { provide: IApprovalRepository, useClass: PrismaApprovalRepository },
    { provide: IApprovalCapabilityPort, useExisting: IApprovalRepository },
    CreateWorkflowUseCase,
    GetWorkflowsUseCase,
    GetWorkflowByIdUseCase,
    GetPendingApprovalsUseCase,
    ProcessApprovalUseCase,
  ],
  exports: [IApprovalRepository, IApprovalCapabilityPort],
})
export class ApprovalModule {}
