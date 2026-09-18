import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppKey } from '../../shared/domain/enums/app-key.enum.js'

@Injectable()
export class StorageKeyBuilder {
  constructor(private readonly configService: ConfigService) {}

  private get envSegment(): string {
    return this.configService.get<string>('NODE_ENV') === 'production'
      ? 'production'
      : 'dev'
  }

  build(app: AppKey, segments: string[], filename: string): string {
    return [this.envSegment, app.toLowerCase(), ...segments, filename].join('/')
  }
}
