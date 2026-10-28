import { Global, Module } from '@nestjs/common'
import { HttpScorePublisherAdapter } from './http-score-publisher.adapter.js'
import { IScorePublisherPort } from './score-publisher.port.js'

@Global()
@Module({
  providers: [
    { provide: IScorePublisherPort, useClass: HttpScorePublisherAdapter },
  ],
  exports: [IScorePublisherPort],
})
export class ScorePublisherModule {}
