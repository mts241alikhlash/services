import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import {
  CorrectableField,
  PresenceCorrectionEntity,
  PresenceCorrectionWithActor,
} from '../../domain/entities/presence-correction.entity.js'
import {
  IPresenceCorrectionRepository,
  RecordCorrectionInput,
} from '../../domain/interfaces/presence-correction-repository.interface.js'

@Injectable()
export class PrismaPresenceCorrectionRepository implements IPresenceCorrectionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
  ) {}

  async recordMany(
    inputs: RecordCorrectionInput[],
  ): Promise<PresenceCorrectionEntity[]> {
    if (inputs.length === 0) return []

    return this.prisma.$transaction(
      inputs.map((input) =>
        this.prisma.presenceCorrection.create({ data: input }),
      ),
    ) as Promise<PresenceCorrectionEntity[]>
  }

  async findByDailyPresence(
    dailyPresenceId: string,
  ): Promise<PresenceCorrectionWithActor[]> {
    const rows = await this.prisma.presenceCorrection.findMany({
      where: { dailyPresenceId },
      orderBy: { createdAt: 'desc' },
    })

    const profiles = await this.profileLookupPort.findByUserIds(
      rows.map((row) => row.actorId),
    )
    const byUserId = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    )

    return rows.map(({ field, ...correction }) => ({
      ...correction,
      field: field as CorrectableField,
      actor: {
        id: correction.actorId,
        displayName: byUserId.get(correction.actorId)?.name ?? null,
      },
    }))
  }

  async findCorrectedIds(dailyPresenceIds: string[]): Promise<Set<string>> {
    if (dailyPresenceIds.length === 0) return new Set()

    const rows = await this.prisma.presenceCorrection.findMany({
      where: { dailyPresenceId: { in: dailyPresenceIds } },
      select: { dailyPresenceId: true },
      distinct: ['dailyPresenceId'],
    })

    return new Set(rows.map((row) => row.dailyPresenceId))
  }
}
