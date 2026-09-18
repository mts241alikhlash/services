import 'reflect-metadata'
import { getMetadataStorage } from 'class-validator'
import { DECORATORS } from '@nestjs/swagger'
import { HttpStatus, ParseUUIDPipe, RequestMethod } from '@nestjs/common'
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
import { CreateCategoryDto } from './dto/request/create-category.dto.js'
import { UpdateCategoryDto } from './dto/request/update-category.dto.js'
import { InventoryCategoryResponseDto } from './dto/response/category-response.dto.js'
import { CategoryController } from './category.controller.js'

describe('CategoryController', () => {
  function controllerWithSpies() {
    const getCategoriesUseCase = { execute: jest.fn() }
    const createCategoryUseCase = { execute: jest.fn() }
    const updateCategoryUseCase = { execute: jest.fn() }
    const deleteCategoryUseCase = { execute: jest.fn() }

    return {
      controller: new CategoryController(
        getCategoriesUseCase as never,
        createCategoryUseCase as never,
        updateCategoryUseCase as never,
        deleteCategoryUseCase as never,
      ),
      getCategoriesUseCase,
      createCategoryUseCase,
      updateCategoryUseCase,
      deleteCategoryUseCase,
    }
  }

  it('delegates list, create, and update routes', async () => {
    const {
      controller,
      getCategoriesUseCase,
      createCategoryUseCase,
      updateCategoryUseCase,
    } = controllerWithSpies()
    const createInput = {
      code: 'CAT-001',
      name: 'Electronics',
      depreciationRatePercent: 10,
    }
    const updateInput = { name: 'Updated electronics' }

    await controller.getCategories('electronics')
    await controller.createCategory(createInput)
    await controller.updateCategory('category-1', updateInput)

    expect(getCategoriesUseCase.execute).toHaveBeenCalledWith('electronics')
    expect(createCategoryUseCase.execute).toHaveBeenCalledWith(createInput)
    expect(updateCategoryUseCase.execute).toHaveBeenCalledWith(
      'category-1',
      updateInput,
    )
  })

  it('delegates delete and returns no content', async () => {
    const { controller, deleteCategoryUseCase } = controllerWithSpies()

    await expect(
      controller.deleteCategory('category-1'),
    ).resolves.toBeUndefined()

    expect(deleteCategoryUseCase.execute).toHaveBeenCalledWith('category-1')
  })

  it('keeps route methods, permissions, and delete status metadata', () => {
    const methods = [
      ['getCategories', RequestMethod.GET, 'inventory-reference-data.read'],
      ['createCategory', RequestMethod.POST, 'inventory-reference-data.create'],
      [
        'updateCategory',
        RequestMethod.PATCH,
        'inventory-reference-data.update',
      ],
      [
        'deleteCategory',
        RequestMethod.DELETE,
        'inventory-reference-data.delete',
      ],
    ] as const

    expect(Reflect.getMetadata(PATH_METADATA, CategoryController)).toBe(
      'inventory/categories',
    )
    for (const [methodName, method, permission] of methods) {
      const handler = CategoryController.prototype[methodName]
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(method)
      expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual([
        permission,
      ])
    }
    expect(
      Reflect.getMetadata(
        HTTP_CODE_METADATA,
        CategoryController.prototype.deleteCategory,
      ),
    ).toBe(HttpStatus.NO_CONTENT)
  })

  it('keeps controller guard and Swagger metadata', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, CategoryController)).toEqual([
      JwtAuthGuard,
    ])
    expect(
      Reflect.getMetadata(DECORATORS.API_TAGS, CategoryController),
    ).toEqual(['Inventory Categories'])
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, CategoryController),
    ).toEqual([{ bearer: [] }])

    const contracts = [
      [
        'getCategories',
        'Get category list',
        200,
        InventoryCategoryResponseDto,
        true,
      ],
      [
        'createCategory',
        'Create category item',
        201,
        InventoryCategoryResponseDto,
        false,
      ],
      [
        'updateCategory',
        'Update category item',
        200,
        InventoryCategoryResponseDto,
        false,
      ],
    ] as const

    for (const [methodName, summary, status, type, isArray] of contracts) {
      const handler = CategoryController.prototype[methodName]
      expect(Reflect.getMetadata(DECORATORS.API_OPERATION, handler)).toEqual({
        summary,
      })
      expect(Reflect.getMetadata(DECORATORS.API_RESPONSE, handler)).toEqual({
        [status]: expect.objectContaining({ type, isArray }),
      })
    }
  })

  it('keeps DTO validation metadata and UUID pipes', async () => {
    const validation = getMetadataStorage()
    const createRules = validation
      .getTargetValidationMetadatas(CreateCategoryDto, '', false, false)
      .reduce<Record<string, string[]>>((rules, metadata) => {
        rules[metadata.propertyName] ??= []
        rules[metadata.propertyName].push(metadata.name ?? metadata.type)
        return rules
      }, {})

    expect(createRules).toEqual({
      code: expect.arrayContaining(['isString', 'isNotEmpty', 'maxLength']),
      name: expect.arrayContaining(['isString', 'isNotEmpty', 'maxLength']),
      depreciationRatePercent: expect.arrayContaining([
        'isNumber',
        'min',
        'max',
      ]),
    })
    expect(
      validation.getTargetValidationMetadatas(
        UpdateCategoryDto,
        '',
        false,
        false,
      ),
    ).not.toHaveLength(0)

    const uuidMetadata = (methodName: 'updateCategory' | 'deleteCategory') =>
      Reflect.getMetadata(ROUTE_ARGS_METADATA, CategoryController, methodName)[
        `${RouteParamtypes.PARAM}:0`
      ]

    for (const methodName of ['updateCategory', 'deleteCategory'] as const) {
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
})
