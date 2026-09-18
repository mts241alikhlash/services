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
import { CreateLoanDto } from './dto/request/create-loan.dto.js'
import { LoanQueryDto } from './dto/request/loan-query.dto.js'
import { ReturnLoanDto } from './dto/request/return-loan.dto.js'
import { LoanController } from './loan.controller.js'

describe('LoanController', () => {
  const id = '77777777-7777-4777-8777-777777777777'

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
    const getLoansUseCase = { execute: jest.fn() }
    const getLoanByIdUseCase = { execute: jest.fn() }
    const createLoanUseCase = { execute: jest.fn() }
    const returnLoanUseCase = { execute: jest.fn() }
    return {
      controller: new LoanController(
        getLoansUseCase as never,
        getLoanByIdUseCase as never,
        createLoanUseCase as never,
        returnLoanUseCase as never,
      ),
      getLoansUseCase,
      getLoanByIdUseCase,
      createLoanUseCase,
      returnLoanUseCase,
    }
  }

  it('forwards period/query, body, current user, and returned responses', async () => {
    const {
      controller,
      getLoansUseCase,
      getLoanByIdUseCase,
      createLoanUseCase,
      returnLoanUseCase,
    } = controllerWithSpies()
    const query = {
      page: 2,
      limit: 20,
      keyword: 'laptop',
      statusId: id,
      requesterId: '88888888-8888-4888-8888-888888888888',
    }
    const createInput = {
      expectedReturnDate: '2026-10-01',
      purpose: 'Workshop',
      unitIds: ['99999999-9999-4999-8999-999999999999'],
    }
    const returnInput = {
      items: [
        {
          unitId: '99999999-9999-4999-8999-999999999999',
          returnedConditionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        },
      ],
    }
    const user = {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      roles: ['STAFF'],
    }
    const response = { statusCode: 200, message: 'ok', data: [] }
    for (const useCase of [
      getLoansUseCase,
      getLoanByIdUseCase,
      createLoanUseCase,
      returnLoanUseCase,
    ])
      useCase.execute.mockResolvedValue(response)

    await expect(controller.findAll(query)).resolves.toBe(response)
    await expect(controller.findOne(id)).resolves.toBe(response)
    await expect(controller.create(createInput, user as never)).resolves.toBe(
      response,
    )
    await expect(
      controller.returnLoan(id, returnInput, user as never),
    ).resolves.toBe(response)
    expect(getLoansUseCase.execute).toHaveBeenCalledWith(query)
    expect(getLoanByIdUseCase.execute).toHaveBeenCalledWith(id)
    expect(createLoanUseCase.execute).toHaveBeenCalledWith(
      createInput,
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    )
    expect(returnLoanUseCase.execute).toHaveBeenCalledWith(
      id,
      returnInput,
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    )
  })

  it('keeps paths, methods, permissions, guard, and statuses', () => {
    const routes = [
      [
        'findAll',
        RequestMethod.GET,
        'inventory-loans.read',
        HttpStatus.OK,
        '/',
      ],
      [
        'findOne',
        RequestMethod.GET,
        'inventory-loans.read',
        HttpStatus.OK,
        ':id',
      ],
      [
        'create',
        RequestMethod.POST,
        'inventory-loans.create',
        HttpStatus.CREATED,
        '/',
      ],
      [
        'returnLoan',
        RequestMethod.POST,
        'inventory-loans.update',
        HttpStatus.OK,
        ':id/return',
      ],
    ] as const
    expect(Reflect.getMetadata(PATH_METADATA, LoanController)).toBe(
      'inventory/loans',
    )
    expect(Reflect.getMetadata(GUARDS_METADATA, LoanController)).toEqual([
      JwtAuthGuard,
    ])
    for (const [methodName, method, permission, status, path] of routes) {
      const handler = LoanController.prototype[methodName]
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
    expect(Reflect.getMetadata(DECORATORS.API_TAGS, LoanController)).toEqual([
      'Inventory Loans',
    ])
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, LoanController),
    ).toEqual([{ bearer: [] }])
    const operations = [
      ['findAll', 'List all loan transactions'],
      ['findOne', 'Get loan transaction by ID'],
      ['create', 'Request a new loan'],
      ['returnLoan', 'Return borrowed assets'],
    ] as const
    for (const [methodName, summary] of operations) {
      expect(
        Reflect.getMetadata(
          DECORATORS.API_OPERATION,
          LoanController.prototype[methodName],
        ),
      ).toEqual({ summary })
    }
  })

  it('keeps DTO validation and UUID pipes', async () => {
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        LoanController.prototype,
        'findAll',
      ),
    ).toEqual([LoanQueryDto])
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        LoanController.prototype,
        'findOne',
      ),
    ).toEqual([String])
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        LoanController.prototype,
        'create',
      ),
    ).toEqual([CreateLoanDto, Object])
    expect(
      Reflect.getMetadata(
        PARAMTYPES_METADATA,
        LoanController.prototype,
        'returnLoan',
      ),
    ).toEqual([String, ReturnLoanDto, Object])
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
    await expectBadRequest(
      pipe.transform(
        { expectedReturnDate: 'bad', purpose: '', unitIds: ['bad'] },
        { type: 'body', metatype: CreateLoanDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { items: [{ unitId: 'bad' }] },
        { type: 'body', metatype: ReturnLoanDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { page: 0 },
        { type: 'query', metatype: LoanQueryDto, data: '' },
      ),
    )
    await expectBadRequest(
      pipe.transform(
        { requesterId: 'not-a-uuid' },
        { type: 'query', metatype: LoanQueryDto, data: '' },
      ),
    )
    for (const methodName of ['findOne', 'returnLoan'] as const) {
      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        LoanController,
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

  it('denies missing loan permission', () => {
    const guard = new PermissionGuard(new Reflector())
    const context = {
      getHandler: () => LoanController.prototype.findAll,
      getClass: () => LoanController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [], permissions: [] } }),
      }),
    } as never
    expectForbidden(guard, context)
  })
})
