import { Test } from '@nestjs/testing'
import { PrismaService } from '../../core/database/prisma.service.js'
import { PrismaModule } from '../../core/database/prisma.module.js'
import { ApprovalModule } from './approval.module.js'
import { IApprovalRepository } from './index.js'
import { PrismaApprovalRepository } from './infrastructure/persistence/prisma/prisma-approval.repository.js'
import { CreateWorkflowUseCase } from './application/use-cases/create-workflow/create-workflow.use-case.js'
import { GetPendingApprovalsUseCase } from './application/use-cases/get-pending-approvals/get-pending-approvals.use-case.js'
import { GetWorkflowByIdUseCase } from './application/use-cases/get-workflow-by-id/get-workflow-by-id.use-case.js'
import { GetWorkflowsUseCase } from './application/use-cases/get-workflows/get-workflows.use-case.js'
import { ProcessApprovalUseCase } from './application/use-cases/process-approval/process-approval.use-case.js'
import { ApprovalController } from './presentation/http/approval.controller.js'
import { WorkflowController } from './presentation/http/workflow.controller.js'
import { IAssetUnitMutationPort } from '../asset/index.js'
import { IHistoryCapabilityPort } from '../circulation/index.js'

describe('ApprovalModule', () => {
  async function moduleRef() {
    return Test.createTestingModule({
      imports: [PrismaModule, ApprovalModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile()
  }

  it('resolves the public repository token to the Prisma adapter', async () => {
    const module = await moduleRef()

    expect(module.get(IApprovalRepository)).toBeInstanceOf(
      PrismaApprovalRepository,
    )
    await module.close()
  })

  it('registers all approval use cases and controllers', async () => {
    const module = await moduleRef()

    for (const provider of [
      CreateWorkflowUseCase,
      GetWorkflowsUseCase,
      GetWorkflowByIdUseCase,
      GetPendingApprovalsUseCase,
      ProcessApprovalUseCase,
      WorkflowController,
      ApprovalController,
    ]) {
      expect(module.get(provider)).toBeInstanceOf(provider)
    }
    await module.close()
  })

  it('resolves movement capabilities from owning modules', async () => {
    const module = await moduleRef()

    expect(module.get(IAssetUnitMutationPort)).toBeDefined()
    expect(module.get(IHistoryCapabilityPort)).toBeDefined()
    await module.close()
  })
})
