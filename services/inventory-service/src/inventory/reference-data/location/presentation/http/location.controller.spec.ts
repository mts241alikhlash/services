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
import { LocationRepositoryOutput } from '../../domain/repositories/location.repository.js'
import { CreateLocationDto } from './dto/request/create-location.dto.js'
import { UpdateLocationDto } from './dto/request/update-location.dto.js'
import { InventoryLocationResponseDto } from './dto/response/location-response.dto.js'
import { LocationController } from './location.controller.js'

describe('LocationController', () => {
  const id = '22222222-2222-4222-8222-222222222222'

  it('keeps location repository output fields', () => {
    const location: LocationRepositoryOutput = {
      id,
      code: 'LAB1',
      name: 'Laboratorium 1',
      building: null,
      room: null,
      rack: null,
      description: null,
      createdAt: new Date(),
    }

    expect(location).toMatchObject({
      building: null,
      room: null,
      rack: null,
      description: null,
      createdAt: expect.any(Date),
    })
  })

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
    const getLocationsUseCase = { execute: jest.fn() }
    const createLocationUseCase = { execute: jest.fn() }
    const updateLocationUseCase = { execute: jest.fn() }
    const deleteLocationUseCase = { execute: jest.fn() }
    return {
      controller: new LocationController(
        getLocationsUseCase as never,
        createLocationUseCase as never,
        updateLocationUseCase as never,
        deleteLocationUseCase as never,
      ),
      getLocationsUseCase,
      createLocationUseCase,
      updateLocationUseCase,
      deleteLocationUseCase,
    }
  }

  it('forwards query and bodies and preserves returned responses', async () => {
    const {
      controller,
      getLocationsUseCase,
      createLocationUseCase,
      updateLocationUseCase,
    } = controllerWithSpies()
    const list = { statusCode: 200, message: 'ok', data: [] }
    const created = { statusCode: 201, message: 'created', data: { id: '1' } }
    const updated = { statusCode: 200, message: 'updated', data: { id: '1' } }
    getLocationsUseCase.execute.mockResolvedValue(list)
    createLocationUseCase.execute.mockResolvedValue(created)
    updateLocationUseCase.execute.mockResolvedValue(updated)
    const createInput = { code: 'LOC-A', name: 'Laboratorium' }
    const updateInput = { room: '301' }

    await expect(controller.getLocations('lab')).resolves.toBe(list)
    await expect(controller.createLocation(createInput)).resolves.toBe(created)
    await expect(controller.updateLocation(id, updateInput)).resolves.toBe(
      updated,
    )
    expect(getLocationsUseCase.execute).toHaveBeenCalledWith('lab')
    expect(createLocationUseCase.execute).toHaveBeenCalledWith(createInput)
    expect(updateLocationUseCase.execute).toHaveBeenCalledWith(id, updateInput)
  })

  it('forwards delete and returns no content', async () => {
    const { controller, deleteLocationUseCase } = controllerWithSpies()
    await expect(controller.deleteLocation(id)).resolves.toBeUndefined()
    expect(deleteLocationUseCase.execute).toHaveBeenCalledWith(id)
  })

  it('keeps route paths, methods, permissions, and effective statuses', () => {
    const routes = [
      [
        'getLocations',
        RequestMethod.GET,
        'inventory-reference-data.read',
        HttpStatus.OK,
        '/',
      ],
      [
        'createLocation',
        RequestMethod.POST,
        'inventory-reference-data.create',
        HttpStatus.CREATED,
        '/',
      ],
      [
        'updateLocation',
        RequestMethod.PATCH,
        'inventory-reference-data.update',
        HttpStatus.OK,
        ':id',
      ],
      [
        'deleteLocation',
        RequestMethod.DELETE,
        'inventory-reference-data.delete',
        HttpStatus.NO_CONTENT,
        ':id',
      ],
    ] as const
    expect(Reflect.getMetadata(PATH_METADATA, LocationController)).toBe(
      'inventory/locations',
    )
    for (const [methodName, method, permission, status, path] of routes) {
      const handler = LocationController.prototype[methodName]
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
    expect(Reflect.getMetadata(GUARDS_METADATA, LocationController)).toEqual([
      JwtAuthGuard,
    ])
    expect(
      Reflect.getMetadata(DECORATORS.API_TAGS, LocationController),
    ).toEqual(['Inventory Locations'])
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, LocationController),
    ).toEqual([{ bearer: [] }])
    expect(
      Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        LocationController.prototype.getLocations,
      ),
    ).toEqual([
      expect.objectContaining({
        name: 'search',
        in: 'query',
        required: false,
      }),
    ])

    const contracts = [
      ['getLocations', 'Get location list', 200, true],
      ['createLocation', 'Create location item', 201, false],
      ['updateLocation', 'Update location item', 200, false],
    ] as const
    for (const [methodName, summary, status, isArray] of contracts) {
      const handler = LocationController.prototype[methodName]
      expect(Reflect.getMetadata(DECORATORS.API_OPERATION, handler)).toEqual({
        summary,
      })
      expect(Reflect.getMetadata(DECORATORS.API_RESPONSE, handler)).toEqual({
        [status]: expect.objectContaining({
          type: InventoryLocationResponseDto,
          isArray,
        }),
      })
    }
    expect(
      Reflect.getMetadata(
        DECORATORS.API_RESPONSE,
        LocationController.prototype.deleteLocation,
      ),
    ).toHaveProperty('204')
  })

  it('keeps DTO validation and UUID handling', async () => {
    const validation = getMetadataStorage()
    expect(
      validation.getTargetValidationMetadatas(
        CreateLocationDto,
        '',
        false,
        false,
      ),
    ).not.toHaveLength(0)
    expect(
      validation.getTargetValidationMetadatas(
        UpdateLocationDto,
        '',
        false,
        false,
      ),
    ).not.toHaveLength(0)
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        LocationController.prototype,
        'createLocation',
      ),
    ).toEqual([CreateLocationDto])
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        LocationController.prototype,
        'updateLocation',
      ),
    ).toEqual([String, UpdateLocationDto])

    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
    await expectBadRequest(
      pipe.transform(
        { code: '', name: 'Lab' },
        { type: 'body', metatype: CreateLocationDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { name: [] },
        { type: 'body', metatype: UpdateLocationDto, data: '' },
      ),
    )
    for (const field of ['building', 'room', 'rack'] as const) {
      await expectBadRequest(
        pipe.transform(
          { [field]: 'x'.repeat(101) },
          { type: 'body', metatype: CreateLocationDto, data: '' },
        ),
      )
    }

    for (const methodName of ['updateLocation', 'deleteLocation'] as const) {
      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        LocationController,
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

  it('denies missing location permission with HTTP 403', () => {
    const guard = new PermissionGuard(new Reflector())
    const context = {
      getHandler: () => LocationController.prototype.getLocations,
      getClass: () => LocationController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [], permissions: [] } }),
      }),
    } as unknown as ExecutionContext
    expectForbidden(guard, context)
  })
})
