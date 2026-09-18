import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { toSlug } from '../../../shared/helpers/slug.helper.js'
import { ICategoryRepository } from '../domain/interfaces/category-repository.interface.js'
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/request/category.dto.js'
import { PortalCacheService } from '../../shared/services/portal-cache.service.js'

@Injectable()
export class GetCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(activeOnly = false) {
    return activeOnly
      ? this.categoryRepository.findAllActive()
      : this.categoryRepository.findAll()
  }
}

@Injectable()
export class GetPublicCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute() {
    return this.categoryRepository.findActiveWithPublishedCounts()
  }
}

@Injectable()
export class CreateCategoryUseCase {
  private readonly logger = new Logger(CreateCategoryUseCase.name)

  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly cache: PortalCacheService,
  ) {}

  async execute(dto: CreateCategoryDto) {
    const slug = await this.assertFreeSlug(dto.slug ?? dto.name)

    const category = await this.categoryRepository.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      isActive: dto.isActive,
      displayOrder: dto.displayOrder,
    })

    await this.cache.invalidate()

    this.logger.log(`Category created: "${category.name}"`)
    return category
  }

  private async assertFreeSlug(source: string): Promise<string> {
    const slug = toSlug(source)
    if (slug.length === 0) {
      throw new BadRequestException(
        'The category name does not produce a valid slug',
      )
    }
    if (await this.categoryRepository.findBySlug(slug)) {
      throw new ConflictException(`Category "${slug}" already exists`)
    }
    return slug
  }
}

@Injectable()
export class UpdateCategoryUseCase {
  private readonly logger = new Logger(UpdateCategoryUseCase.name)

  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly cache: PortalCacheService,
  ) {}

  async execute(id: string, dto: UpdateCategoryDto) {
    const existing = await this.categoryRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Kategori dengan ID ${id} not found`)
    }

    const data: Parameters<ICategoryRepository['update']>[1] = {}
    if (dto.name !== undefined) data.name = dto.name
    if (dto.description !== undefined) data.description = dto.description
    if (dto.isActive !== undefined) data.isActive = dto.isActive
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder

    if (dto.slug !== undefined) {
      const slug = toSlug(dto.slug)
      if (slug !== existing.slug) {
        const clash = await this.categoryRepository.findBySlug(slug)
        if (clash)
          throw new ConflictException(`Category "${slug}" already exists`)
        data.slug = slug
      }
    }

    const updated = await this.categoryRepository.update(id, data)
    await this.cache.invalidate()

    this.logger.log(`Category updated: "${updated.name}"`)
    return updated
  }
}

@Injectable()
export class DeleteCategoryUseCase {
  private readonly logger = new Logger(DeleteCategoryUseCase.name)

  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly cache: PortalCacheService,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.categoryRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Kategori dengan ID ${id} not found`)
    }

    const usage = await this.categoryRepository.findUsage(id)
    if (usage.count > 0) {
      throw new ConflictException({
        message: `Category is still used by ${usage.count} item(s). Deactivate it instead if it should no longer be applied.`,
        count: usage.count,
        sampleTitles: usage.sampleTitles,
      })
    }

    await this.categoryRepository.softDelete(id)
    await this.cache.invalidate()

    this.logger.log(`Category deleted: "${existing.name}"`)
  }
}
