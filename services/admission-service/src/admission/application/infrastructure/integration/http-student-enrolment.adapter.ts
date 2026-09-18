import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  EnrolStudentInput,
  EnrolStudentResult,
  IStudentEnrolmentPort,
} from './student-enrolment.port.js'

@Injectable()
export class HttpStudentEnrolmentAdapter implements IStudentEnrolmentPort {
  private readonly logger = new Logger(HttpStudentEnrolmentAdapter.name)

  constructor(private readonly config: ConfigService) {}

  async enrol(
    input: EnrolStudentInput,
    bearerToken: string,
  ): Promise<EnrolStudentResult> {
    const base = this.config.get<string>('STUDENT_SERVICE_URL')
    if (!base) {
      throw new InternalServerErrorException(
        'STUDENT_SERVICE_URL is not configured, so an accepted applicant cannot be enrolled.',
      )
    }

    let response: Response
    try {
      response = await fetch(`${base.replace(/\/+$/, '')}/students/enrol`, {
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
      data?: EnrolStudentResult
      message?: string | string[]
    } | null

    if (!response.ok) {
      const message = Array.isArray(body?.message)
        ? body.message.join('; ')
        : (body?.message ?? 'The student service refused the enrolment.')
      throw new HttpException(message, response.status)
    }

    if (!body?.data) {
      throw new InternalServerErrorException(
        'The student service returned no enrolment result.',
      )
    }

    return body.data
  }
}
