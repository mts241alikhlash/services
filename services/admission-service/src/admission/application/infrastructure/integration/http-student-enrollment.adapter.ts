import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  EnrollStudentInput,
  EnrollStudentResult,
  IStudentEnrollmentPort,
} from './student-enrollment.port.js'

@Injectable()
export class HttpStudentEnrollmentAdapter implements IStudentEnrollmentPort {
  private readonly logger = new Logger(HttpStudentEnrollmentAdapter.name)

  constructor(private readonly config: ConfigService) {}

  async enroll(
    input: EnrollStudentInput,
    bearerToken: string,
  ): Promise<EnrollStudentResult> {
    const base = this.config.get<string>('STUDENT_SERVICE_URL')
    if (!base) {
      throw new InternalServerErrorException(
        'STUDENT_SERVICE_URL is not configured, so an accepted applicant cannot be enrolled.',
      )
    }

    let response: Response
    try {
      response = await fetch(`${base.replace(/\/+$/, '')}/students/enroll`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(input),
      })
    } catch (cause) {
      this.logger.error(
        `student-service unreachable at ${base}: ${String(cause)}`,
      )
      throw new InternalServerErrorException(
        'The student service could not be reached. The applicant has not been enrolled; try again.',
      )
    }

    const body = (await response.json().catch(() => null)) as {
      data?: EnrollStudentResult
      message?: string | string[]
    } | null

    if (!response.ok) {
      const message = Array.isArray(body?.message)
        ? body.message.join('; ')
        : (body?.message ?? 'The student service refused the enrollment.')
      throw new HttpException(message, response.status)
    }

    if (!body?.data) {
      throw new InternalServerErrorException(
        'The student service returned no enrollment result.',
      )
    }

    return body.data
  }

  async updateNis(
    studentId: string,
    nis: string,
    bearerToken: string,
  ): Promise<void> {
    const base = this.config.get<string>('STUDENT_SERVICE_URL')
    if (!base) {
      throw new InternalServerErrorException(
        'STUDENT_SERVICE_URL is not configured, so the NIS of a student cannot be changed.',
      )
    }

    let response: Response
    try {
      response = await fetch(
        `${base.replace(/\/+$/, '')}/students/${studentId}`,
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${bearerToken}`,
          },
          body: JSON.stringify({ nis }),
        },
      )
    } catch (cause) {
      this.logger.error(
        `student-service unreachable at ${base}: ${String(cause)}`,
      )
      throw new InternalServerErrorException(
        'The student service could not be reached. The NIS has not been changed there; try again.',
      )
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        message?: string | string[]
      } | null
      const message = Array.isArray(body?.message)
        ? body.message.join('; ')
        : (body?.message ?? 'The student service refused the NIS change.')
      throw new HttpException(message, response.status)
    }
  }
}
