import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
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
import { AssetUnitQueryDto } from './dto/request/asset-unit-query.dto.js'
import { UpdateUnitDto } from './dto/request/update-unit.dto.js'
import { AssetUnitController } from './asset-unit.controller.js'

describe('AssetUnitController', () => {
  const id = '66666666-6666-4666-8666-666666666666'

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
    const getAssetUnitsUseCase = { execute: jest.fn() }
    const updateUnitUseCase = { execute: jest.fn() }
    const deleteUnitUseCase = { execute: jest.fn() }
    return {
      controller: new AssetUnitController(
        getAssetUnitsUseCase as never,
        updateUnitUseCase as never,
        deleteUnitUseCase as never,
      ),
      getAssetUnitsUseCase,
      updateUnitUseCase,
      deleteUnitUseCase,
    }
  }

  it('forwards lendable query, update body, and returned responses', async () => {
    const { controller, getAssetUnitsUseCase, updateUnitUseCase } =
      controllerWithSpies()
    const query = { page: 1, limit: 10, lendable: true, search: '001' }
    const updateInput = {
      statusId: '33333333-3333-4333-8333-333333333333',
      locationId: '55555555-5555-4555-8555-555555555555',
    }
    const response = { statusCode: 200, message: 'ok', data: [] }
    getAssetUnitsUseCase.execute.mockResolvedValue(response)
    updateUnitUseCase.execute.mockResolvedValue(response)

    await expect(controller.findAll(query)).resolves.toBe(response)
    await expect(controller.update(id, updateInput)).resolves.toBe(response)
    expect(getAssetUnitsUseCase.execute).toHaveBeenCalledWith(query)
    expect(updateUnitUseCase.execute).toHaveBeenCalledWith(id, updateInput)
  })

  it('forwards delete and returns no content', async () => {
    const { controller, deleteUnitUseCase } = controllerWithSpies()
    await expect(controller.remove(id)).resolves.toBeUndefined()
    expect(deleteUnitUseCase.execute).toHaveBeenCalledWith(id)
  })

  it('keeps paths, methods, permissions, guard, and statuses', () => {
    const routes = [
      [
        'findAll',
        RequestMethod.GET,
        'inventory-assets.read',
        HttpStatus.OK,
        '/',
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
    expect(Reflect.getMetadata(PATH_METADATA, AssetUnitController)).toBe(
      'inventory/asset-units',
    )
    expect(Reflect.getMetadata(GUARDS_METADATA, AssetUnitController)).toEqual([
      JwtAuthGuard,
    ])
    for (const [methodName, method, permission, status, path] of routes) {
      const handler = AssetUnitController.prototype[methodName]
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
      Reflect.getMetadata(DECORATORS.API_TAGS, AssetUnitController),
    ).toEqual(['Inventory Asset Units'])
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, AssetUnitController),
    ).toEqual([{ bearer: [] }])
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        AssetUnitController.prototype.findAll,
      ),
    ).toEqual({
      summary: 'List asset units (paginated, searchable, lendable-only)',
    })
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        AssetUnitController.prototype.update,
      ),
    ).toEqual({
      summary:
        'Update an asset unit (condition/status/location/custodian/etc.)',
    })
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        AssetUnitController.prototype.remove,
      ),
    ).toEqual({ summary: 'Soft-delete an asset unit' })
  })

  it('keeps query and body validation and UUID pipes', async () => {
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        AssetUnitController.prototype,
        'findAll',
      ),
    ).toEqual([AssetUnitQueryDto])
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        AssetUnitController.prototype,
        'update',
      ),
    ).toEqual([String, UpdateUnitDto])
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
    await expectBadRequest(
      pipe.transform(
        { page: 0 },
        { type: 'query', metatype: AssetUnitQueryDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { statusId: 'bad' },
        { type: 'body', metatype: UpdateUnitDto, data: '' },
      ),
    )
    expect(
      plainToInstance(AssetUnitQueryDto, { lendable: 'not-a-boolean' })
        .lendable,
    ).toBe(false)
    await expect(
      pipe.transform(
        { lendable: 'true' },
        { type: 'query', metatype: AssetUnitQueryDto, data: '' },
      ),
    ).resolves.toEqual(expect.objectContaining({ lendable: true }))
    for (const methodName of ['update', 'remove'] as const) {
      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        AssetUnitController,
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

  it('denies missing asset permission', () => {
    const guard = new PermissionGuard(new Reflector())
    const context = {
      getHandler: () => AssetUnitController.prototype.findAll,
      getClass: () => AssetUnitController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [], permissions: [] } }),
      }),
    } as never
    expectForbidden(guard, context)
  })
})
