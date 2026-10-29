import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import {
  IScorePublisherPort,
  type ExamScorePayload,
  type PublishOutcome,
} from './score-publisher.port.js'

const URL_KEY = 'ASSESSMENT_SERVICE_URL'

@Injectable()
export class HttpScorePublisherAdapter extends IScorePublisherPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async publish(payload: ExamScorePayload): Promise<PublishOutcome> {
    let status: number
    try {
      status = await this.client.postStatus(URL_KEY, '/exam-scores', payload)
    } catch {
      return {
        result: 'RETRY',
        reason: 'assessment-service could not be asked',
      }
    }

    if (status >= 200 && status < 300) return { result: 'SENT' }
    if (status === 0) {
      return {
        result: 'RETRY',
        reason: 'assessment-service could not be reached',
      }
    }
    if (status === 429 || status >= 500) {
      return {
        result: 'RETRY',
        reason: `assessment-service answered ${status}`,
      }
    }
    return {
      result: 'REJECTED',
      reason: `assessment-service refused with ${status}`,
    }
  }
}
