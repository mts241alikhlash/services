import { Injectable, NotFoundException } from '@nestjs/common'
import {
  PaginatedResponse,
  PaginatedResult,
} from '../../../shared/domain/interfaces/repository.interface.js'
import { DailyPresenceEntity } from '../domain/entities/daily-presence.entity.js'
import { PresenceCorrectionWithActor } from '../domain/entities/presence-correction.entity.js'
import {
  DailyPresenceQueryInput,
  DailyPresenceWithDetails,
} from '../domain/interfaces/daily-presence-recap.interface.js'
import { IDailyPresenceRepository } from '../domain/interfaces/daily-presence-repository.interface.js'
import { IPresenceCorrectionRepository } from '../domain/interfaces/presence-correction-repository.interface.js'

function paginate<T>(result: PaginatedResult<T>): PaginatedResponse<T> {
  const { data, total, page, limit } = result
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

@Injectable()
export class GetDailyPresencesUseCase {
  constructor(private readonly dailyPresence: IDailyPresenceRepository) {}

  async execute(
    query: DailyPresenceQueryInput,
  ): Promise<PaginatedResponse<DailyPresenceWithDetails>> {
    return paginate(await this.dailyPresence.findAll(query))
  }
}

export interface DailyPresenceDetail extends DailyPresenceEntity {
  corrections: PresenceCorrectionWithActor[]
}

@Injectable()
export class GetDailyPresenceByIdUseCase {
  constructor(
    private readonly dailyPresence: IDailyPresenceRepository,
    private readonly corrections: IPresenceCorrectionRepository,
  ) {}

  async execute(id: string): Promise<DailyPresenceDetail> {
    const record = await this.dailyPresence.findById(id)
    if (!record) {
      throw new NotFoundException('Attendance record not found')
    }

    return {
      ...record,
      corrections: await this.corrections.findByDailyPresence(id),
    }
  }
}

@Injectable()
export class GetMyDailyPresencesUseCase {
  constructor(private readonly dailyPresence: IDailyPresenceRepository) {}

  async execute(
    userId: string,
    year: number,
    month: number,
  ): Promise<{ year: number; month: number; days: DailyPresenceEntity[] }> {
    return {
      year,
      month,
      days: await this.dailyPresence.findByUserAndMonth(userId, year, month),
    }
  }
}
