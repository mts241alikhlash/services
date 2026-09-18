import { Injectable, NotFoundException } from '@nestjs/common'
import { PaginatedResponse } from '../../../shared/domain/interfaces/repository.interface.js'
import { IAgendaRepository } from '../domain/interfaces/agenda-repository.interface.js'
import { PublicAgendaQueryDto } from '../dto/request/agenda.dto.js'
import { toPublicAgenda } from '../infrastructure/mappers/agenda.mapper.js'

@Injectable()
export class GetPublicAgendaUseCase {
  constructor(private readonly agendaRepository: IAgendaRepository) {}

  async execute(
    query: PublicAgendaQueryDto,
  ): Promise<PaginatedResponse<unknown>> {
    const { data, total, page, limit } = await this.agendaRepository.findPublic(
      {
        page: query.page,
        limit: query.limit,
        scope: query.scope ?? 'upcoming',
      },
    )

    return {
      data: data.map(toPublicAgenda),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}

@Injectable()
export class GetPublicAgendaBySlugUseCase {
  constructor(private readonly agendaRepository: IAgendaRepository) {}

  async execute(slug: string) {
    const entry = await this.agendaRepository.findPublicBySlug(slug)
    if (!entry) {
      throw new NotFoundException('Page not found')
    }
    return toPublicAgenda(entry)
  }
}
