import 'reflect-metadata'
import { getMetadataStorage } from 'class-validator'
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
import { JwtAuthGuard } from '../../../../../platform/auth/index.js'
import { PERMISSIONS_KEY } from '../../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { PermissionGuard } from '../../../../../platform/access-control/permission/guards/permission.guard.js'
import { CreateStatusDto } from './dto/request/create-status.dto.js'
import { UpdateStatusDto } from './dto/request/update-status.dto.js'
import { InventoryStatusResponseDto } from './dto/response/status-response.dto.js'
import { InventoryStatusKey } from '../../../../../shared/domain/enums/inventory-status-key.enum.js'
import { StatusController } from './status.controller.js'

describe('StatusController', () => {
  const id = '33333333-3333-4333-8333-333333333333'

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
    const getStatusesUseCase = { execute: jest.fn() }
    const createStatusUseCase = { execute: jest.fn() }
    const updateStatusUseCase = { execute: jest.fn() }
    const deleteStatusUseCase = { execute: jest.fn() }
    return {
      controller: new StatusController(
        getStatusesUseCase as never,
        createStatusUseCase as never,
        updateStatusUseCase as never,
        deleteStatusUseCase as never,
      ),
      getStatusesUseCase,
      createStatusUseCase,
      updateStatusUseCase,
      deleteStatusUseCase,
    }
  }

  it('forwards query and bodies and preserves returned responses', async () => {
    const {
      controller,
      getStatusesUseCase,
      createStatusUseCase,
      updateStatusUseCase,
    } = controllerWithSpies()
    const list = { statusCode: 200, message: 'ok', data: [] }
    const created = { statusCode: 201, message: 'created', data: { id: '1' } }
    const updated = { statusCode: 200, message: 'updated', data: { id: '1' } }
    getStatusesUseCase.execute.mockResolvedValue(list)
    createStatusUseCase.execute.mockResolvedValue(created)
    updateStatusUseCase.execute.mockResolvedValue(updated)
    const createInput = {
      code: 'ACTIVE',
      name: 'Active',
      allowTransactions: true,
    }
    const updateInput = { name: 'Available' }

    await expect(controller.getStatuses('active')).resolves.toBe(list)
    await expect(controller.createStatus(createInput)).resolves.toBe(created)
    await expect(controller.updateStatus(id, updateInput)).resolves.toBe(
      updated,
    )
    expect(getStatusesUseCase.execute).toHaveBeenCalledWith('active')
    expect(createStatusUseCase.execute).toHaveBeenCalledWith(createInput)
    expect(updateStatusUseCase.execute).toHaveBeenCalledWith(id, updateInput)
  })

  it('forwards delete and returns no content', async () => {
    const { controller, deleteStatusUseCase } = controllerWithSpies()
    await expect(controller.deleteStatus(id)).resolves.toBeUndefined()
    expect(deleteStatusUseCase.execute).toHaveBeenCalledWith(id)
  })

  it('keeps route paths, methods, permissions, and effective statuses', () => {
    const routes = [
      [
        'getStatuses',
        RequestMethod.GET,
        'inventory-reference-data.read',
        HttpStatus.OK,
        '/',
      ],
      [
        'createStatus',
        RequestMethod.POST,
        'inventory-reference-data.create',
        HttpStatus.CREATED,
        '/',
      ],
      [
        'updateStatus',
        RequestMethod.PATCH,
        'inventory-reference-data.update',
        HttpStatus.OK,
        ':id',
      ],
      [
        'deleteStatus',
        RequestMethod.DELETE,
        'inventory-reference-data.delete',
        HttpStatus.NO_CONTENT,
        ':id',
      ],
    ] as const
    expect(Reflect.getMetadata(PATH_METADATA, StatusController)).toBe(
      'inventory/statuses',
    )
    for (const [methodName, method, permission, status, path] of routes) {
      const handler = StatusController.prototype[methodName]
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

  it('keeps class guard and declared Swagger metadata', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, StatusController)).toEqual([
      JwtAuthGuard,
    ])
    expect(Reflect.getMetadata(DECORATORS.API_TAGS, StatusController)).toEqual([
      'Inventory Statuses',
    ])
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, StatusController),
    ).toEqual([{ bearer: [] }])

    const contracts = [
      ['getStatuses', 'Get status list', 200, true],
      ['createStatus', 'Create status item', 201, false],
      ['updateStatus', 'Update status item', 200, false],
    ] as const
    for (const [methodName, summary, status, isArray] of contracts) {
      const handler = StatusController.prototype[methodName]
      expect(Reflect.getMetadata(DECORATORS.API_OPERATION, handler)).toEqual({
        summary,
      })
      expect(Reflect.getMetadata(DECORATORS.API_RESPONSE, handler)).toEqual({
        [status]: expect.objectContaining({
          type: InventoryStatusResponseDto,
          isArray,
        }),
      })
    }

    expect(
      Reflect.getMetadata(
        DECORATORS.API_RESPONSE,
        StatusController.prototype.deleteStatus,
      ),
    ).toEqual({
      [HttpStatus.NO_CONTENT]: {
        description: '',
        isArray: undefined,
        type: undefined,
      },
    })
  })

  it('keeps response DTO inside presentation and domain boundaries', () => {
    expect(
      Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        InventoryStatusResponseDto.prototype,
        'systemKey',
      ).enum,
    ).toEqual(Object.values(InventoryStatusKey))
  })

  it('keeps DTO validation and UUID handling', async () => {
    const validation = getMetadataStorage()
    expect(
      validation.getTargetValidationMetadatas(
        CreateStatusDto,
        '',
        false,
        false,
      ),
    ).not.toHaveLength(0)
    expect(
      validation.getTargetValidationMetadatas(
        UpdateStatusDto,
        '',
        false,
        false,
      ),
    ).not.toHaveLength(0)
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        StatusController.prototype,
        'createStatus',
      ),
    ).toEqual([CreateStatusDto])
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        StatusController.prototype,
        'updateStatus',
      ),
    ).toEqual([String, UpdateStatusDto])

    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
    await expectBadRequest(
      pipe.transform(
        { code: '', name: 'Active' },
        { type: 'body', metatype: CreateStatusDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { systemKey: 'not_a_status_key' },
        { type: 'body', metatype: UpdateStatusDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { unexpected: true },
        { type: 'body', metatype: CreateStatusDto, data: '' },
      ),
    )
    expect(
      validation
        .getTargetValidationMetadatas(CreateStatusDto, '', false, false)
        .filter((metadata) => metadata.propertyName === 'allowTransactions')
        .map((metadata) => metadata.name),
    ).toContain('isBoolean')

    for (const methodName of ['updateStatus', 'deleteStatus'] as const) {
      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        StatusController,
        methodName,
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
    }
  })

  it('keeps valid system-key values accepted', async () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
    await expect(
      pipe.transform(
        {
          code: 'ACTIVE',
          name: 'Active',
          systemKey: InventoryStatusKey.AVAILABLE,
        },
        { type: 'body', metatype: CreateStatusDto, data: '' },
      ),
    ).resolves.toEqual(
      expect.objectContaining({ systemKey: InventoryStatusKey.AVAILABLE }),
    )
  })

  it('denies missing status permission with HTTP 403', () => {
    const guard = new PermissionGuard(new Reflector())
    const context = {
      getHandler: () => StatusController.prototype.getStatuses,
      getClass: () => StatusController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [], permissions: [] } }),
      }),
    } as unknown as ExecutionContext
    expectForbidden(guard, context)
  })
})
