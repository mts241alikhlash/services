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
import { Reflector } from '@nestjs/core'
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PARAMTYPES_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants'
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js'
import { JwtAuthGuard } from '../../../../../platform/auth/index.js'
import { PERMISSIONS_KEY } from '../../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { PermissionGuard } from '../../../../../platform/access-control/permission/guards/permission.guard.js'
import { CreateFundingSourceDto } from './dto/request/create-funding-source.dto.js'
import { UpdateFundingSourceDto } from './dto/request/update-funding-source.dto.js'
import { InventoryFundingSourceResponseDto } from './dto/response/funding-source-response.dto.js'
import { FundingSourceController } from './funding-source.controller.js'

describe('FundingSourceController', () => {
  const id = '11111111-1111-4111-8111-111111111111'

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
    const getFundingSourcesUseCase = { execute: jest.fn() }
    const createFundingSourceUseCase = { execute: jest.fn() }
    const updateFundingSourceUseCase = { execute: jest.fn() }
    const deleteFundingSourceUseCase = { execute: jest.fn() }

    return {
      controller: new FundingSourceController(
        getFundingSourcesUseCase as never,
        createFundingSourceUseCase as never,
        updateFundingSourceUseCase as never,
        deleteFundingSourceUseCase as never,
      ),
      getFundingSourcesUseCase,
      createFundingSourceUseCase,
      updateFundingSourceUseCase,
      deleteFundingSourceUseCase,
    }
  }

  it('forwards query and bodies and preserves returned responses', async () => {
    const {
      controller,
      getFundingSourcesUseCase,
      createFundingSourceUseCase,
      updateFundingSourceUseCase,
    } = controllerWithSpies()
    const list = { statusCode: 200, message: 'ok', data: [] }
    const created = { statusCode: 201, message: 'created', data: { id: '1' } }
    const updated = { statusCode: 200, message: 'updated', data: { id: '1' } }
    getFundingSourcesUseCase.execute.mockResolvedValue(list)
    createFundingSourceUseCase.execute.mockResolvedValue(created)
    updateFundingSourceUseCase.execute.mockResolvedValue(updated)
    const createInput = { code: 'FUND-GOV', name: 'APBD' }
    const updateInput = { name: 'BOS' }

    await expect(controller.getFundingSources('ap')).resolves.toBe(list)
    await expect(controller.createFundingSource(createInput)).resolves.toBe(
      created,
    )
    await expect(controller.updateFundingSource(id, updateInput)).resolves.toBe(
      updated,
    )

    expect(getFundingSourcesUseCase.execute).toHaveBeenCalledWith('ap')
    expect(createFundingSourceUseCase.execute).toHaveBeenCalledWith(createInput)
    expect(updateFundingSourceUseCase.execute).toHaveBeenCalledWith(
      id,
      updateInput,
    )
  })

  it('forwards delete and returns no content', async () => {
    const { controller, deleteFundingSourceUseCase } = controllerWithSpies()

    await expect(controller.deleteFundingSource(id)).resolves.toBeUndefined()
    expect(deleteFundingSourceUseCase.execute).toHaveBeenCalledWith(id)
  })

  it('keeps route paths, methods, permissions, and effective statuses', () => {
    const routes = [
      [
        'getFundingSources',
        RequestMethod.GET,
        'inventory-reference-data.read',
        HttpStatus.OK,
        '/',
      ],
      [
        'createFundingSource',
        RequestMethod.POST,
        'inventory-reference-data.create',
        HttpStatus.CREATED,
        '/',
      ],
      [
        'updateFundingSource',
        RequestMethod.PATCH,
        'inventory-reference-data.update',
        HttpStatus.OK,
        ':id',
      ],
      [
        'deleteFundingSource',
        RequestMethod.DELETE,
        'inventory-reference-data.delete',
        HttpStatus.NO_CONTENT,
        ':id',
      ],
    ] as const

    expect(Reflect.getMetadata(PATH_METADATA, FundingSourceController)).toBe(
      'inventory/funding-sources',
    )
    for (const [methodName, method, permission, status, path] of routes) {
      const handler = FundingSourceController.prototype[methodName]
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

  it('keeps guards and Swagger response metadata', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, FundingSourceController),
    ).toEqual([JwtAuthGuard])
    expect(
      Reflect.getMetadata(DECORATORS.API_TAGS, FundingSourceController),
    ).toEqual(['Inventory Funding Sources'])
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, FundingSourceController),
    ).toEqual([{ bearer: [] }])

    const operations = [
      ['getFundingSources', 'Get funding source list'],
      ['createFundingSource', 'Create funding source item'],
      ['updateFundingSource', 'Update funding source item'],
      ['deleteFundingSource', 'Delete funding source item'],
    ] as const
    for (const [methodName, summary] of operations) {
      expect(
        Reflect.getMetadata(
          DECORATORS.API_OPERATION,
          FundingSourceController.prototype[methodName],
        ),
      ).toEqual({ summary })
    }

    expect(
      Reflect.getMetadata(
        DECORATORS.API_RESPONSE,
        FundingSourceController.prototype.getFundingSources,
      ),
    ).toEqual({
      200: expect.objectContaining({
        type: InventoryFundingSourceResponseDto,
        isArray: true,
      }),
    })
    expect(
      Reflect.getMetadata(
        DECORATORS.API_RESPONSE,
        FundingSourceController.prototype.createFundingSource,
      ),
    ).toEqual({
      201: expect.objectContaining({
        type: InventoryFundingSourceResponseDto,
        isArray: false,
      }),
    })
    expect(
      Reflect.getMetadata(
        DECORATORS.API_RESPONSE,
        FundingSourceController.prototype.updateFundingSource,
      ),
    ).toEqual({
      200: expect.objectContaining({
        type: InventoryFundingSourceResponseDto,
        isArray: false,
      }),
    })
    expect(
      Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        FundingSourceController.prototype.getFundingSources,
      ),
    ).toEqual([
      expect.objectContaining({
        name: 'search',
        in: 'query',
        required: false,
      }),
    ])
    expect(
      Reflect.getMetadata(
        DECORATORS.API_RESPONSE,
        FundingSourceController.prototype.deleteFundingSource,
      ),
    ).toHaveProperty('204')
  })

  it('keeps DTO validation and UUID handling', async () => {
    const validation = getMetadataStorage()
    expect(
      validation.getTargetValidationMetadatas(
        CreateFundingSourceDto,
        '',
        false,
        false,
      ),
    ).not.toHaveLength(0)
    expect(
      validation.getTargetValidationMetadatas(
        UpdateFundingSourceDto,
        '',
        false,
        false,
      ),
    ).not.toHaveLength(0)

    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        FundingSourceController.prototype,
        'createFundingSource',
      ),
    ).toEqual([CreateFundingSourceDto])
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        FundingSourceController.prototype,
        'updateFundingSource',
      ),
    ).toEqual([String, UpdateFundingSourceDto])

    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
    await expectBadRequest(
      pipe.transform(
        { code: '', name: 'APBD' },
        {
          type: 'body',
          metatype: CreateFundingSourceDto,
          data: '',
        },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { name: '' },
        {
          type: 'body',
          metatype: UpdateFundingSourceDto,
          data: '',
        },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { code: 'x'.repeat(21), name: 'APBD' },
        { type: 'body', metatype: CreateFundingSourceDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { code: 'FUND-GOV', name: 'x'.repeat(101) },
        { type: 'body', metatype: CreateFundingSourceDto, data: '' },
      ),
    )

    for (const methodName of [
      'updateFundingSource',
      'deleteFundingSource',
    ] as const) {
      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        FundingSourceController,
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

  it('denies missing permissions', () => {
    const guard = new PermissionGuard(new Reflector())
    const context = {
      getHandler: () => FundingSourceController.prototype.getFundingSources,
      getClass: () => FundingSourceController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [], permissions: [] } }),
      }),
    } as unknown as ExecutionContext

    expectForbidden(guard, context)
  })
})
