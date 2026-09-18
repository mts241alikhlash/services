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
import { ApproveActionDto } from './dto/request/approve-action.dto.js'
import { ApprovalController } from './approval.controller.js'

describe('ApprovalController', () => {
  const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

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
    const getPendingApprovalsUseCase = { execute: jest.fn() }
    const processApprovalUseCase = { execute: jest.fn() }
    return {
      controller: new ApprovalController(
        getPendingApprovalsUseCase as never,
        processApprovalUseCase as never,
      ),
      getPendingApprovalsUseCase,
      processApprovalUseCase,
    }
  }

  it('forwards pending roles and approval action inputs and preserves responses', async () => {
    const { controller, getPendingApprovalsUseCase, processApprovalUseCase } =
      controllerWithSpies()
    const user = {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      roles: ['ADMIN'],
    }
    const action = {
      action: 'APPROVE' as const,
      note: 'Checked',
      forwardToNextApprover: true,
    }
    const response = { statusCode: 200, message: 'ok', data: [] }
    getPendingApprovalsUseCase.execute.mockResolvedValue(response)
    processApprovalUseCase.execute.mockResolvedValue(response)

    await expect(controller.findPending(user as never)).resolves.toBe(response)
    await expect(controller.process(id, action, user as never)).resolves.toBe(
      response,
    )
    expect(getPendingApprovalsUseCase.execute).toHaveBeenCalledWith(['ADMIN'])
    expect(processApprovalUseCase.execute).toHaveBeenCalledWith(
      id,
      action,
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      ['ADMIN'],
    )
  })

  it('keeps paths, methods, permissions, guard, and statuses', () => {
    const routes = [
      [
        'findPending',
        RequestMethod.GET,
        'inventory-approvals.read',
        HttpStatus.OK,
        '/',
      ],
      [
        'process',
        RequestMethod.POST,
        'inventory-approvals.update',
        HttpStatus.OK,
        ':id/action',
      ],
    ] as const
    expect(Reflect.getMetadata(PATH_METADATA, ApprovalController)).toBe(
      'inventory/approvals',
    )
    expect(Reflect.getMetadata(GUARDS_METADATA, ApprovalController)).toEqual([
      JwtAuthGuard,
    ])
    for (const [methodName, method, permission, status, path] of routes) {
      const handler = ApprovalController.prototype[methodName]
      expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(path)
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(method)
      expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual([
        permission,
      ])
      expect(
        Reflect.getMetadata(HTTP_CODE_METADATA, handler) ?? HttpStatus.OK,
      ).toBe(status)
    }
  })

  it('keeps declared Swagger metadata', () => {
    expect(
      Reflect.getMetadata(DECORATORS.API_TAGS, ApprovalController),
    ).toEqual(['Inventory Approvals'])
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, ApprovalController),
    ).toEqual([{ bearer: [] }])
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        ApprovalController.prototype.findPending,
      ),
    ).toEqual({
      summary: 'Get pending approvals assigned to the current user roles',
    })
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        ApprovalController.prototype.process,
      ),
    ).toEqual({ summary: 'Approve or reject a pending workflow step' })
  })

  it('keeps approval action DTO Swagger property metadata', () => {
    expect(
      Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        ApproveActionDto.prototype,
        'action',
      ),
    ).toEqual(
      expect.objectContaining({
        enum: ['APPROVE', 'REJECT'],
        description: 'Action to perform: APPROVE or REJECT',
      }),
    )
  })

  it('keeps action validation and approval UUID handling', async () => {
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        ApprovalController.prototype,
        'process',
      ),
    ).toEqual([String, ApproveActionDto, Object])
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
    await expectBadRequest(
      pipe.transform(
        { action: 'WAIT' },
        { type: 'body', metatype: ApproveActionDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { action: 'APPROVE', unexpected: true },
        { type: 'body', metatype: ApproveActionDto, data: '' },
      ),
    )
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      ApprovalController,
      'process',
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

  it('denies missing approval permission', () => {
    const guard = new PermissionGuard(new Reflector())
    const context = {
      getHandler: () => ApprovalController.prototype.findPending,
      getClass: () => ApprovalController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [], permissions: [] } }),
      }),
    } as never
    expectForbidden(guard, context)
  })
})
