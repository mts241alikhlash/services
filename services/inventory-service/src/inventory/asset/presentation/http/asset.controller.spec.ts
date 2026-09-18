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
import { CreateAssetDto } from './dto/request/create-asset.dto.js'
import { CreateUnitsDto } from './dto/request/create-units.dto.js'
import { UpdateAssetDto } from './dto/request/update-asset.dto.js'
import { AssetQueryDto } from './dto/request/asset-query.dto.js'
import { AssetController } from './asset.controller.js'

describe('AssetController', () => {
  const id = '44444444-4444-4444-8444-444444444444'

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
    const getAssetsUseCase = { execute: jest.fn() }
    const getAssetByIdUseCase = { execute: jest.fn() }
    const createAssetUseCase = { execute: jest.fn() }
    const updateAssetUseCase = { execute: jest.fn() }
    const deleteAssetUseCase = { execute: jest.fn() }
    const addUnitsUseCase = { execute: jest.fn() }
    return {
      controller: new AssetController(
        getAssetsUseCase as never,
        getAssetByIdUseCase as never,
        createAssetUseCase as never,
        updateAssetUseCase as never,
        deleteAssetUseCase as never,
        addUnitsUseCase as never,
      ),
      getAssetsUseCase,
      getAssetByIdUseCase,
      createAssetUseCase,
      updateAssetUseCase,
      deleteAssetUseCase,
      addUnitsUseCase,
    }
  }

  it('forwards list, detail, create, add-units, and update inputs', async () => {
    const {
      controller,
      getAssetsUseCase,
      getAssetByIdUseCase,
      createAssetUseCase,
      addUnitsUseCase,
      updateAssetUseCase,
    } = controllerWithSpies()
    const query = { page: 2, limit: 5, keyword: 'laptop' }
    const createInput = {
      name: 'Laptop',
      categoryId: '11111111-1111-4111-8111-111111111111',
      purchaseDate: '2026-01-15',
      purchasePrice: 15000000,
      locationId: '55555555-5555-4555-8555-555555555555',
      statusId: '33333333-3333-4333-8333-333333333333',
      conditionId: '22222222-2222-4222-8222-222222222222',
    }
    const unitsInput = {
      quantity: 2,
      conditionId: '22222222-2222-4222-8222-222222222222',
      statusId: '33333333-3333-4333-8333-333333333333',
      locationId: '55555555-5555-4555-8555-555555555555',
    }
    const updateInput = { name: 'Updated laptop' }
    const response = { statusCode: 200, message: 'ok', data: [] }
    for (const useCase of [
      getAssetsUseCase,
      getAssetByIdUseCase,
      createAssetUseCase,
      addUnitsUseCase,
      updateAssetUseCase,
    ]) {
      useCase.execute.mockResolvedValue(response)
    }

    await expect(controller.findAll(query)).resolves.toBe(response)
    await expect(controller.findOne(id)).resolves.toBe(response)
    await expect(controller.create(createInput)).resolves.toBe(response)
    await expect(controller.addUnits(id, unitsInput)).resolves.toBe(response)
    await expect(controller.update(id, updateInput)).resolves.toBe(response)
    expect(getAssetsUseCase.execute).toHaveBeenCalledWith(query)
    expect(getAssetByIdUseCase.execute).toHaveBeenCalledWith(id)
    expect(createAssetUseCase.execute).toHaveBeenCalledWith(createInput)
    expect(addUnitsUseCase.execute).toHaveBeenCalledWith(id, unitsInput)
    expect(updateAssetUseCase.execute).toHaveBeenCalledWith(id, updateInput)
  })

  it('forwards delete and returns no content', async () => {
    const { controller, deleteAssetUseCase } = controllerWithSpies()
    await expect(controller.remove(id)).resolves.toBeUndefined()
    expect(deleteAssetUseCase.execute).toHaveBeenCalledWith(id)
  })

  it('keeps paths, methods, permissions, guards, and statuses', () => {
    const routes = [
      [
        'findAll',
        RequestMethod.GET,
        'inventory-assets.read',
        HttpStatus.OK,
        '/',
      ],
      [
        'findOne',
        RequestMethod.GET,
        'inventory-assets.read',
        HttpStatus.OK,
        ':id',
      ],
      [
        'create',
        RequestMethod.POST,
        'inventory-assets.create',
        HttpStatus.CREATED,
        '/',
      ],
      [
        'addUnits',
        RequestMethod.POST,
        'inventory-assets.create',
        HttpStatus.CREATED,
        ':id/units',
      ],
      [
        'update',
        RequestMethod.PATCH,
        'inventory-assets.update',
        HttpStatus.OK,
        ':id',
      ],
      [
        'remove',
        RequestMethod.DELETE,
        'inventory-assets.delete',
        HttpStatus.NO_CONTENT,
        ':id',
      ],
    ] as const
    expect(Reflect.getMetadata(PATH_METADATA, AssetController)).toBe(
      'inventory/assets',
    )
    expect(Reflect.getMetadata(GUARDS_METADATA, AssetController)).toEqual([
      JwtAuthGuard,
    ])
    for (const [methodName, method, permission, status, path] of routes) {
      const handler = AssetController.prototype[methodName]
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
    expect(Reflect.getMetadata(DECORATORS.API_TAGS, AssetController)).toEqual([
      'Inventory Assets',
    ])
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, AssetController),
    ).toEqual([{ bearer: [] }])
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        AssetController.prototype.findAll,
      ),
    ).toEqual({ summary: 'List all inventory assets (paginated, filterable)' })
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        AssetController.prototype.findOne,
      ),
    ).toEqual({ summary: 'Get asset by ID' })
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        AssetController.prototype.create,
      ),
    ).toEqual({
      summary: 'Create a new asset (parent) with N numbered units (quantity)',
    })
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        AssetController.prototype.addUnits,
      ),
    ).toEqual({ summary: 'Add more physical units to an existing asset' })
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        AssetController.prototype.update,
      ),
    ).toEqual({ summary: 'Update an existing asset' })
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        AssetController.prototype.remove,
      ),
    ).toEqual({ summary: 'Soft-delete an asset' })
  })

  it('keeps body validation and UUID pipes', async () => {
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        AssetController.prototype,
        'findAll',
      ),
    ).toEqual([AssetQueryDto])
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        AssetController.prototype,
        'create',
      ),
    ).toEqual([CreateAssetDto])
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        AssetController.prototype,
        'addUnits',
      ),
    ).toEqual([String, CreateUnitsDto])
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        AssetController.prototype,
        'update',
      ),
    ).toEqual([String, UpdateAssetDto])

    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
    await expectBadRequest(
      pipe.transform(
        {
          name: '',
          categoryId: 'not-a-uuid',
          purchaseDate: 'not-a-date',
          purchasePrice: -1,
          locationId: 'not-a-uuid',
          statusId: 'not-a-uuid',
          conditionId: 'not-a-uuid',
        },
        { type: 'body', metatype: CreateAssetDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        {
          conditionId: 'not-a-uuid',
          statusId: 'not-a-uuid',
          locationId: 'not-a-uuid',
        },
        { type: 'body', metatype: CreateUnitsDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { categoryId: 'not-a-uuid' },
        { type: 'body', metatype: UpdateAssetDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { page: 0 },
        { type: 'query', metatype: AssetQueryDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { limit: 'not-a-number' },
        { type: 'query', metatype: AssetQueryDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { unexpected: true },
        { type: 'query', metatype: AssetQueryDto, data: '' },
      ),
    )

    for (const methodName of [
      'findOne',
      'addUnits',
      'update',
      'remove',
    ] as const) {
      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        AssetController,
        methodName,
      )
      const parameter = metadata[`${RouteParamtypes.PARAM}:0`]
      expect(parameter.data).toBe('id')
      expect(parameter.pipes).toEqual([ParseUUIDPipe])
      await expectBadRequest(
        new parameter.pipes[0]().transform('not-a-uuid', {
          type: 'param',
          data: 'id',
          metatype: String,
        }),
        'Validation failed (uuid is expected)',
      )
    }
  })

  it('denies missing asset permission', () => {
    const guard = new PermissionGuard(new Reflector())
    const context = {
      getHandler: () => AssetController.prototype.findAll,
      getClass: () => AssetController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [], permissions: [] } }),
      }),
    } as never
    expectForbidden(guard, context)
  })
})
