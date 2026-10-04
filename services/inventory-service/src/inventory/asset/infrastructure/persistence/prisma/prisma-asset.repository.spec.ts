import type { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { IAssetCategoryLookupPort } from '../../../domain/repositories/category-lookup.port.js'
import type { IAssetFundingSourceLookupPort } from '../../../domain/repositories/funding-source-lookup.port.js'
import type { IAssetConditionLookupPort } from '../../../domain/repositories/condition-lookup.port.js'
import type { IAssetStatusLookupPort } from '../../../domain/repositories/status-lookup.port.js'
import type { IAssetLocationLookupPort } from '../../../domain/repositories/location-lookup.port.js'
import { PrismaAssetRepository } from './prisma-asset.repository.js'

describe('PrismaAssetRepository', () => {
  const date = new Date('2026-01-15T00:00:00.000Z')
  const asset = {
    id: 'asset-1',
    assetNumber: 'AST-COMP/2026/001',
    name: 'Laptop',
    categoryId: 'category-1',
    fundingSourceId: 'funding-1',
    brand: 'Lenovo',
    model: 'T14',
    purchaseDate: date,
    purchasePrice: { toString: () => '15000000' },
    usefulLifeMonths: 48,
    notes: 'Staff device',
    deletedAt: null,
    category: { id: 'category-1', code: 'COMP', name: 'Computer' },
    fundingSource: { id: 'funding-1', code: 'BUDGET', name: 'Budget' },
    units: [
      {
        id: 'unit-1',
        assetId: 'asset-1',
        unitNumber: 'AST-COMP/2026/001-01',
        barcode: 'AST-COMP/2026/001-01',
        currentBookValue: { toString: () => '15000000' },
        conditionId: 'condition-1',
        statusId: 'status-1',
        locationId: 'location-1',
        custodianId: null,
        notes: null,
        deletedAt: null,
        condition: { id: 'condition-1', code: 'GOOD', name: 'Good' },
        status: { id: 'status-1', code: 'AVAILABLE', name: 'Available' },
        location: { id: 'location-1', code: 'LAB', name: 'Lab' },
      },
    ],
    _count: { units: 1 },
    legacyField: 'must not escape adapter',
  }

  function repositoryWithSpies() {
    const findMany = jest.fn().mockResolvedValue([asset])
    const count = jest.fn().mockResolvedValue(1)
    const findFirst = jest.fn().mockResolvedValue(asset)
    const categoryFindById = jest.fn().mockResolvedValue(asset.category)
    const fundingSourceFindById = jest
      .fn()
      .mockResolvedValue(asset.fundingSource)
    const conditionFindById = jest
      .fn()
      .mockResolvedValue(asset.units[0].condition)
    const statusFindById = jest.fn().mockResolvedValue(asset.units[0].status)
    const locationFindById = jest
      .fn()
      .mockResolvedValue(asset.units[0].location)
    const create = jest.fn().mockResolvedValue(asset)
    const update = jest.fn().mockResolvedValue(asset)
    const prisma = {
      inventoryAsset: {
        findMany,
        count,
        findFirst,
        create,
        update,
      },
      inventoryAssetUnit: { count },
    } as unknown as PrismaService

    return {
      repository: new PrismaAssetRepository(
        prisma,
        { findById: categoryFindById },
        { findById: fundingSourceFindById },
        { findById: conditionFindById },
        { findById: statusFindById, findIdsAllowingTransactions: jest.fn() },
        { findById: locationFindById },
      ),
      findMany,
      count,
      findFirst,
      create,
      update,
      categoryFindById,
    }
  }

  it('maps asset and nested unit fields explicitly while applying all filters', async () => {
    const { repository, findMany, count } = repositoryWithSpies()

    await expect(
      repository.findAll({
        page: 2,
        limit: 5,
        keyword: 'laptop',
        categoryId: 'category-1',
        locationId: 'location-1',
        statusId: 'status-1',
        conditionId: 'condition-1',
        fundingSourceId: 'funding-1',
      }),
    ).resolves.toEqual({
      data: [
        {
          id: asset.id,
          assetNumber: asset.assetNumber,
          name: asset.name,
          categoryId: asset.categoryId,
          fundingSourceId: asset.fundingSourceId,
          brand: asset.brand,
          model: asset.model,
          purchaseDate: asset.purchaseDate,
          purchasePrice: asset.purchasePrice,
          usefulLifeMonths: asset.usefulLifeMonths,
          notes: asset.notes,
          deletedAt: asset.deletedAt,
          category: asset.category,
          fundingSource: asset.fundingSource,
          units: [
            {
              id: 'unit-1',
              assetId: 'asset-1',
              unitNumber: 'AST-COMP/2026/001-01',
              barcode: 'AST-COMP/2026/001-01',
              currentBookValue: asset.units[0].currentBookValue,
              conditionId: 'condition-1',
              statusId: 'status-1',
              locationId: 'location-1',
              custodianId: null,
              notes: null,
              deletedAt: null,
              condition: asset.units[0].condition,
              status: asset.units[0].status,
              location: asset.units[0].location,
            },
          ],
          _count: { units: 1 },
        },
      ],
      total: 1,
      page: 2,
      limit: 5,
    })

    const where = {
      deletedAt: null,
      OR: [
        { name: { contains: 'laptop', mode: 'insensitive' } },
        { assetNumber: { contains: 'laptop', mode: 'insensitive' } },
        { brand: { contains: 'laptop', mode: 'insensitive' } },
        { model: { contains: 'laptop', mode: 'insensitive' } },
        {
          units: {
            some: {
              deletedAt: null,
              unitNumber: { contains: 'laptop', mode: 'insensitive' },
            },
          },
        },
        {
          units: {
            some: {
              deletedAt: null,
              barcode: { contains: 'laptop', mode: 'insensitive' },
            },
          },
        },
      ],
      categoryId: 'category-1',
      fundingSourceId: 'funding-1',
      units: {
        some: {
          deletedAt: null,
          locationId: 'location-1',
          statusId: 'status-1',
          conditionId: 'condition-1',
        },
      },
    }
    expect(findMany).toHaveBeenCalledWith({
      where,
      skip: 5,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: expect.any(Object),
    })
    expect(count).toHaveBeenCalledWith({ where })
  })

  it('does not keyword-match a soft-deleted unit', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findAll({ page: 1, limit: 10, keyword: 'deleted-unit' })

    expect(findMany.mock.calls[0][0].where.OR).toEqual([
      { name: { contains: 'deleted-unit', mode: 'insensitive' } },
      { assetNumber: { contains: 'deleted-unit', mode: 'insensitive' } },
      { brand: { contains: 'deleted-unit', mode: 'insensitive' } },
      { model: { contains: 'deleted-unit', mode: 'insensitive' } },
      {
        units: {
          some: {
            deletedAt: null,
            unitNumber: { contains: 'deleted-unit', mode: 'insensitive' },
          },
        },
      },
      {
        units: {
          some: {
            deletedAt: null,
            barcode: { contains: 'deleted-unit', mode: 'insensitive' },
          },
        },
      },
    ])
  })

  it('maps nested create input and numeric unit values', async () => {
    const { repository, create } = repositoryWithSpies()
    const input = {
      assetNumber: 'AST-COMP/2026/001',
      name: 'Laptop',
      purchaseDate: date,
      purchasePrice: 15000000,
      categoryId: 'category-1',
      fundingSourceId: 'funding-1',
      units: [
        {
          unitNumber: 'AST-COMP/2026/001-01',
          barcode: 'AST-COMP/2026/001-01',
          currentBookValue: '15000000',
          conditionId: 'condition-1',
          statusId: 'status-1',
          locationId: 'location-1',
        },
      ],
    }

    await repository.create(input)

    expect(create).toHaveBeenCalledWith({
      data: {
        assetNumber: input.assetNumber,
        name: input.name,
        purchaseDate: input.purchaseDate,
        purchasePrice: input.purchasePrice,
        categoryId: input.categoryId,
        fundingSourceId: input.fundingSourceId,
        units: {
          create: [
            {
              unitNumber: input.units[0].unitNumber,
              barcode: input.units[0].barcode,
              currentBookValue: 15000000,
              conditionId: input.units[0].conditionId,
              statusId: input.units[0].statusId,
              locationId: input.units[0].locationId,
            },
          ],
        },
      },
      include: expect.any(Object),
    })
  })

  it('keeps soft-delete filters and propagates Prisma lookup errors', async () => {
    const { repository, findFirst } = repositoryWithSpies()
    const error = new Error('database unavailable')
    findFirst.mockRejectedValue(error)

    await expect(repository.findById('asset-1')).rejects.toBe(error)
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'asset-1', deletedAt: null },
      include: expect.any(Object),
    })
  })

  it('uses category capability port for category lookup', async () => {
    const { repository, categoryFindById } = repositoryWithSpies()

    await expect(repository.findCategoryById('category-1')).resolves.toEqual({
      id: 'category-1',
      code: 'COMP',
    })
    expect(categoryFindById).toHaveBeenCalledWith('category-1')
  })
})
