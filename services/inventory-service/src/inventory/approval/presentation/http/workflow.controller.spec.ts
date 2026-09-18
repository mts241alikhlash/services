import 'reflect-metadata'
import { DECORATORS } from '@nestjs/swagger'
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  ParseUUIDPipe,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common'
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PARAMTYPES_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants'
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js'
import { Reflector } from '@nestjs/core'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { PermissionGuard } from '../../../../platform/access-control/permission/guards/permission.guard.js'
import {
  CreateWorkflowDto,
  CreateWorkflowStepDto,
} from './dto/request/create-workflow.dto.js'
import { WorkflowController } from './workflow.controller.js'

describe('WorkflowController', () => {
  const id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

  async function expectBadRequest(
    promise: Promise<unknown>,
    message: unknown = expect.arrayContaining([expect.any(String)]),
  ) {
    const error = await promise.catch((error: unknown) => error)
    expect(error).toBeInstanceOf(BadRequestException)
    if (!(error instanceof BadRequestException)) return
    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST)
    expect(error.getResponse()).toEqual({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message,
    })
  }

  function expectForbidden(guard: PermissionGuard, context: ExecutionContext) {
    try {
      guard.canActivate(context)
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException)
      expect((error as ForbiddenException).getStatus()).toBe(
        HttpStatus.FORBIDDEN,
      )
      return
    }
    throw new Error('PermissionGuard allowed a request without permission')
  }

  function controllerWithSpies() {
    const getWorkflowsUseCase = { execute: jest.fn() }
    const getWorkflowByIdUseCase = { execute: jest.fn() }
    const createWorkflowUseCase = { execute: jest.fn() }
    return {
      controller: new WorkflowController(
        getWorkflowsUseCase as never,
        getWorkflowByIdUseCase as never,
        createWorkflowUseCase as never,
      ),
      getWorkflowsUseCase,
      getWorkflowByIdUseCase,
      createWorkflowUseCase,
    }
  }

  it('forwards list, detail, and create inputs and preserves responses', async () => {
    const {
      controller,
      getWorkflowsUseCase,
      getWorkflowByIdUseCase,
      createWorkflowUseCase,
    } = controllerWithSpies()
    const createInput = {
      name: 'Loan approval',
      targetEntity: 'InventoryLoan',
      steps: [{ stepSequence: 1, approverRoleCode: 'ADMIN' }],
    }
    const response = { statusCode: 200, message: 'ok', data: [] }
    for (const useCase of [
      getWorkflowsUseCase,
      getWorkflowByIdUseCase,
      createWorkflowUseCase,
    ])
      useCase.execute.mockResolvedValue(response)

    await expect(controller.findAll()).resolves.toBe(response)
    await expect(controller.findOne(id)).resolves.toBe(response)
    await expect(controller.create(createInput)).resolves.toBe(response)
    expect(getWorkflowsUseCase.execute).toHaveBeenCalledWith()
    expect(getWorkflowByIdUseCase.execute).toHaveBeenCalledWith(id)
    expect(createWorkflowUseCase.execute).toHaveBeenCalledWith(createInput)
  })

  it('keeps paths, methods, permissions, guard, and statuses', () => {
    const routes = [
      [
        'findAll',
        RequestMethod.GET,
        'inventory-approvals.read',
        HttpStatus.OK,
        '/',
      ],
      [
        'findOne',
        RequestMethod.GET,
        'inventory-approvals.read',
        HttpStatus.OK,
        ':id',
      ],
      [
        'create',
        RequestMethod.POST,
        'inventory-approvals.create',
        HttpStatus.CREATED,
        '/',
      ],
    ] as const
    expect(Reflect.getMetadata(PATH_METADATA, WorkflowController)).toBe(
      'inventory/workflows',
    )
    expect(Reflect.getMetadata(GUARDS_METADATA, WorkflowController)).toEqual([
      JwtAuthGuard,
    ])
    for (const [methodName, method, permission, status, path] of routes) {
      const handler = WorkflowController.prototype[methodName]
      expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(path)
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(method)
      expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual([
        permission,
      ])
      expect(
        Reflect.getMetadata(HTTP_CODE_METADATA, handler) ??
          (method === RequestMethod.POST ? HttpStatus.CREATED : HttpStatus.OK),
      ).toBe(status)
    }
  })

  it('keeps declared Swagger metadata', () => {
    expect(
      Reflect.getMetadata(DECORATORS.API_TAGS, WorkflowController),
    ).toEqual(['Inventory Workflows'])
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, WorkflowController),
    ).toEqual([{ bearer: [] }])
    const operations = [
      ['findAll', 'List all workflow templates'],
      ['findOne', 'Get workflow template by ID'],
      ['create', 'Create a new workflow template'],
    ] as const
    for (const [methodName, summary] of operations) {
      expect(
        Reflect.getMetadata(
          DECORATORS.API_OPERATION,
          WorkflowController.prototype[methodName],
        ),
      ).toEqual({ summary })
    }
  })

  it('keeps workflow DTO Swagger property metadata', () => {
    expect(
      Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        CreateWorkflowDto.prototype,
        'name',
      ),
    ).toEqual(
      expect.objectContaining({
        description: 'Name of the workflow',
      }),
    )
    expect(
      Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        CreateWorkflowDto.prototype,
        'steps',
      ),
    ).toEqual(
      expect.objectContaining({
        type: CreateWorkflowStepDto,
        isArray: true,
      }),
    )
    expect(
      Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        CreateWorkflowStepDto.prototype,
        'stepSequence',
      ),
    ).toEqual(
      expect.objectContaining({
        description: 'Sequence number of the step (1-indexed)',
      }),
    )
  })

  it('keeps workflow validation and detail UUID handling', async () => {
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        WorkflowController.prototype,
        'findOne',
      ),
    ).toEqual([String])
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        WorkflowController.prototype,
        'create',
      ),
    ).toEqual([CreateWorkflowDto])
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
    await expectBadRequest(
      pipe.transform(
        { name: '', targetEntity: 'Loan', steps: [] },
        { type: 'body', metatype: CreateWorkflowDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        {
          name: 'Workflow',
          targetEntity: 'Loan',
          steps: [{ stepSequence: 1 }],
        },
        { type: 'body', metatype: CreateWorkflowDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        {
          name: 'Workflow',
          targetEntity: 'Loan',
          steps: [{ stepSequence: 0, approverRoleCode: '' }],
        },
        { type: 'body', metatype: CreateWorkflowDto, data: '' },
      ),
    )
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      WorkflowController,
      'findOne',
    )[`${RouteParamtypes.PARAM}:0`]
    expect(metadata.data).toBe('id')
    expect(metadata.pipes).toEqual([ParseUUIDPipe])
    await expectBadRequest(
      new metadata.pipes[0]().transform('not-a-uuid', {
        type: 'param',
        data: 'id',
        metatype: String,
      }),
      'Validation failed (uuid is expected)',
    )
  })

  it('denies missing workflow permission', () => {
    const guard = new PermissionGuard(new Reflector())
    const context = {
      getHandler: () => WorkflowController.prototype.findAll,
      getClass: () => WorkflowController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [], permissions: [] } }),
      }),
    } as never
    expectForbidden(guard, context)
  })
})
