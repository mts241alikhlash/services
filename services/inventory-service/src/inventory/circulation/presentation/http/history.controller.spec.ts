import 'reflect-metadata'
import { DECORATORS } from '@nestjs/swagger'
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common'
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PARAMTYPES_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants'
import { Reflector } from '@nestjs/core'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { PermissionGuard } from '../../../../platform/access-control/permission/guards/permission.guard.js'
import { HistoryQueryDto } from './dto/request/history-query.dto.js'
import { HistoryController } from './history.controller.js'

describe('HistoryController', () => {
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

  it('forwards history query and preserves response', async () => {
    const getHistoriesUseCase = { execute: jest.fn() }
    const controller = new HistoryController(getHistoriesUseCase as never)
    const query = {
      page: 3,
      limit: 25,
      unitId: '99999999-9999-4999-8999-999999999999',
    }
    const response = { statusCode: 200, message: 'ok', data: [] }
    getHistoriesUseCase.execute.mockResolvedValue(response)

    await expect(controller.findAll(query)).resolves.toBe(response)
    expect(getHistoriesUseCase.execute).toHaveBeenCalledWith(query)
  })

  it('keeps path, method, permission, guard, and success status', () => {
    expect(Reflect.getMetadata(PATH_METADATA, HistoryController)).toBe(
      'inventory/histories',
    )
    expect(
      Reflect.getMetadata(METHOD_METADATA, HistoryController.prototype.findAll),
    ).toBe(RequestMethod.GET)
    expect(
      Reflect.getMetadata(PATH_METADATA, HistoryController.prototype.findAll),
    ).toBe('/')
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, HistoryController.prototype.findAll),
    ).toEqual(['inventory-loans.read'])
    expect(Reflect.getMetadata(GUARDS_METADATA, HistoryController)).toEqual([
      JwtAuthGuard,
    ])
    expect(
      Reflect.getMetadata(
        HTTP_CODE_METADATA,
        HistoryController.prototype.findAll,
      ) ?? HttpStatus.OK,
    ).toBe(HttpStatus.OK)
  })

  it('keeps declared Swagger metadata', () => {
    expect(Reflect.getMetadata(DECORATORS.API_TAGS, HistoryController)).toEqual(
      ['Inventory Asset History'],
    )
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, HistoryController),
    ).toEqual([{ bearer: [] }])
    expect(
      Reflect.getMetadata(
        DECORATORS.API_OPERATION,
        HistoryController.prototype.findAll,
      ),
    ).toEqual({ summary: 'List all asset circulation history logs' })
  })

  it('rejects invalid pagination and unit UUID query values', async () => {
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        HistoryController.prototype,
        'findAll',
      ),
    ).toEqual([HistoryQueryDto])
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
    await expectBadRequest(
      pipe.transform(
        { page: 0 },
        { type: 'query', metatype: HistoryQueryDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { unitId: 'not-a-uuid' },
        { type: 'query', metatype: HistoryQueryDto, data: '' },
      ),
    )
  })

  it('denies missing history permission', () => {
    const guard = new PermissionGuard(new Reflector())
    const context = {
      getHandler: () => HistoryController.prototype.findAll,
      getClass: () => HistoryController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [], permissions: [] } }),
      }),
    } as never
    expectForbidden(guard, context)
  })
})
