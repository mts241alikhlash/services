import 'reflect-metadata'
import { getMetadataStorage } from 'class-validator'
import { DECORATORS } from '@nestjs/swagger'
import {
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
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants'
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js'
import { JwtAuthGuard } from '../../../../../platform/auth/index.js'
import { PERMISSIONS_KEY } from '../../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { PermissionGuard } from '../../../../../platform/access-control/permission/guards/permission.guard.js'
import { CreateConditionDto } from './dto/request/create-condition.dto.js'
import { UpdateConditionDto } from './dto/request/update-condition.dto.js'
import { InventoryConditionResponseDto } from './dto/response/condition-response.dto.js'
import { ConditionController } from './condition.controller.js'

describe('ConditionController', () => {
  function controllerWithSpies() {
    const getConditionsUseCase = { execute: jest.fn() }
    const createConditionUseCase = { execute: jest.fn() }
    const updateConditionUseCase = { execute: jest.fn() }
    const deleteConditionUseCase = { execute: jest.fn() }

    return {
      controller: new ConditionController(
        getConditionsUseCase as never,
        createConditionUseCase as never,
        updateConditionUseCase as never,
        deleteConditionUseCase as never,
      ),
      getConditionsUseCase,
      createConditionUseCase,
      updateConditionUseCase,
      deleteConditionUseCase,
    }
  }

  it('delegates list, create, and update routes', async () => {
    const {
      controller,
      getConditionsUseCase,
      createConditionUseCase,
      updateConditionUseCase,
    } = controllerWithSpies()
    const createInput = { code: 'COND-GOOD', name: 'Baik', isUsable: true }
    const updateInput = { name: 'Rusak' }

    await controller.getConditions('baik')
    await controller.createCondition(createInput)
    await controller.updateCondition('condition-1', updateInput)

    expect(getConditionsUseCase.execute).toHaveBeenCalledWith('baik')
    expect(createConditionUseCase.execute).toHaveBeenCalledWith(createInput)
    expect(updateConditionUseCase.execute).toHaveBeenCalledWith(
      'condition-1',
      updateInput,
    )
  })

  it('delegates delete and returns no content', async () => {
    const { controller, deleteConditionUseCase } = controllerWithSpies()

    await expect(
      controller.deleteCondition('condition-1'),
    ).resolves.toBeUndefined()

    expect(deleteConditionUseCase.execute).toHaveBeenCalledWith('condition-1')
  })

  it('keeps route methods, permissions, and delete status metadata', () => {
    const methods = [
      ['getConditions', RequestMethod.GET, 'inventory-reference-data.read'],
      [
        'createCondition',
        RequestMethod.POST,
        'inventory-reference-data.create',
      ],
      [
        'updateCondition',
        RequestMethod.PATCH,
        'inventory-reference-data.update',
      ],
      [
        'deleteCondition',
        RequestMethod.DELETE,
        'inventory-reference-data.delete',
      ],
    ] as const

    expect(Reflect.getMetadata(PATH_METADATA, ConditionController)).toBe(
      'inventory/conditions',
    )
    for (const [methodName, method, permission] of methods) {
      const handler = ConditionController.prototype[methodName]
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(method)
      expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual([
        permission,
      ])
    }
    expect(
      Reflect.getMetadata(
        HTTP_CODE_METADATA,
        ConditionController.prototype.deleteCondition,
      ),
    ).toBe(HttpStatus.NO_CONTENT)
  })

  it('keeps controller guard and Swagger metadata', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ConditionController)).toEqual([
      JwtAuthGuard,
    ])
    expect(
      Reflect.getMetadata(DECORATORS.API_TAGS, ConditionController),
    ).toEqual(['Inventory Conditions'])
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, ConditionController),
    ).toEqual([{ bearer: [] }])

    const contracts = [
      ['getConditions', 'Get condition list', 200, true],
      ['createCondition', 'Create condition item', 201, false],
      ['updateCondition', 'Update condition item', 200, false],
    ] as const

    for (const [methodName, summary, status, isArray] of contracts) {
      const handler = ConditionController.prototype[methodName]
      expect(Reflect.getMetadata(DECORATORS.API_OPERATION, handler)).toEqual({
        summary,
      })
      expect(Reflect.getMetadata(DECORATORS.API_RESPONSE, handler)).toEqual({
        [status]: expect.objectContaining({
          type: InventoryConditionResponseDto,
          isArray,
        }),
      })
    }
  })

  it('keeps DTO validation metadata and UUID pipes', async () => {
    const validation = getMetadataStorage()
    const createRules = validation
      .getTargetValidationMetadatas(CreateConditionDto, '', false, false)
      .reduce<Record<string, string[]>>((rules, metadata) => {
        rules[metadata.propertyName] ??= []
        rules[metadata.propertyName].push(metadata.name ?? metadata.type)
        return rules
      }, {})

    expect(createRules).toEqual({
      code: expect.arrayContaining(['isString', 'isNotEmpty', 'maxLength']),
      name: expect.arrayContaining(['isString', 'isNotEmpty', 'maxLength']),
      isUsable: expect.arrayContaining(['isBoolean']),
    })
    expect(
      validation.getTargetValidationMetadatas(
        UpdateConditionDto,
        '',
        false,
        false,
      ),
    ).not.toHaveLength(0)

    const uuidMetadata = (methodName: 'updateCondition' | 'deleteCondition') =>
      Reflect.getMetadata(ROUTE_ARGS_METADATA, ConditionController, methodName)[
        `${RouteParamtypes.PARAM}:0`
      ]

    for (const methodName of ['updateCondition', 'deleteCondition'] as const) {
      const metadata = uuidMetadata(methodName)
      expect(metadata.data).toBe('id')
      expect(metadata.pipes).toHaveLength(1)
      expect(metadata.pipes[0]).toBe(ParseUUIDPipe)
      await expect(
        new metadata.pipes[0]().transform('not-a-uuid', {
          type: 'param',
          data: 'id',
          metatype: String,
        }),
      ).rejects.toThrow()
    }
  })

  it('rejects invalid create and update bodies through ValidationPipe', async () => {
    const pipe = new ValidationPipe({ transform: true, whitelist: true })

    await expect(
      pipe.transform(
        { code: '', name: 'Baik' },
        { type: 'body', metatype: CreateConditionDto, data: '' },
      ),
    ).rejects.toThrow()
    await expect(
      pipe.transform(
        { name: 123 },
        { type: 'body', metatype: UpdateConditionDto, data: '' },
      ),
    ).rejects.toThrow()
  })

  it('denies missing permission through PermissionGuard', () => {
    const guard = new PermissionGuard(new Reflector())
    const context = {
      getHandler: () => ConditionController.prototype.getConditions,
      getClass: () => ConditionController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [], permissions: [] } }),
      }),
    } as unknown as ExecutionContext

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
  })
})
