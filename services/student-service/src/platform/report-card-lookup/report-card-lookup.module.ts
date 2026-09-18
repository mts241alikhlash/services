import { Global, Module } from '@nestjs/common'
import { IReportCardLookupPort } from './report-card-lookup.port.js'
import { HttpReportCardLookupAdapter } from './http-report-card-lookup.adapter.js'

@Global()
@Module({
  providers: [
    { provide: IReportCardLookupPort, useClass: HttpReportCardLookupAdapter },
  ],
  exports: [IReportCardLookupPort],
})
export class ReportCardLookupModule {}
