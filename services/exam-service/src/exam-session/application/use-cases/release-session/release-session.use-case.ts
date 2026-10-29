import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { ExamSession } from '../../../domain/entities/exam-session.entity.js'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'

@Injectable()
export class ReleaseSessionUseCase {
  constructor(private readonly sessions: IExamSessionRepository) {}

  async execute(
    user: { id: string },
    sessionId: string,
    now: Date = new Date(),
  ): Promise<ExamSession> {
    const session = await this.sessions.findById(sessionId)
    if (session === null) {
      throw new NotFoundException('Sesi ujian tidak ditemukan')
    }
    if (session.status !== 'IN_PROGRESS') {
      throw new ConflictException('Sesi sudah selesai dan tidak bisa dilepas')
    }
    const released = await this.sessions.release(sessionId, user.id, now)
    if (released === null) {
      throw new ConflictException('Sesi sudah selesai dan tidak bisa dilepas')
    }
    return released
  }
}
