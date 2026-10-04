import {
  ArgumentsHost,
  Catch,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import type { Request } from 'express'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { HttpExceptionFilter } from '../../../core/filters/http-exception.filter.js'
import { PayrollAuditService } from '../services/payroll-audit.service.js'

@Catch(ForbiddenException)
@Injectable()
export class PayrollAccessFilter extends HttpExceptionFilter {
  constructor(
    @InjectPinoLogger(HttpExceptionFilter.name) logger: PinoLogger,
    private readonly audit: PayrollAuditService,
  ) {
    super(logger)
  }

  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<Request>()
    const target = request.params?.id

    super.catch(exception, host)

    void this.audit.record(
      'payroll.payslip.denied',
      request.user?.id ?? null,
      typeof target === 'string' ? target : null,
      { path: request.originalUrl || request.url, method: request.method },
    )
  }
}
