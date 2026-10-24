import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import type { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { ROUTE_OPTIONS } from './core/config/route-options.js'
import { AppModule } from './app.module.js'
import { buildSwaggerConfig } from './openapi/swagger-config.js'
import { wrapResponseEnvelope } from './openapi/wrap-response-envelope.js'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    ...ROUTE_OPTIONS,
  })

  app.useLogger(app.get(Logger))
  app.enableShutdownHooks()

  const configService = app.get(ConfigService)
  const port = configService.get<number>('PORT', 3000)
  const trustProxy = configService.get<number>('TRUST_PROXY', 0)
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:5173',
  )
  const isProduction = configService.get<string>('NODE_ENV') === 'production'

  app.set('trust proxy', trustProxy)

  app.use((req: Request, _res: Response, next: NextFunction) => {
    req._startTime = Date.now()
    next()
  })

  app.use(cookieParser())

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? undefined
        : {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
              styleSrc: ["'self'", "'unsafe-inline'"],
            },
          },
    }),
  )

  const frontendUrls = frontendUrl
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true)
      if (frontendUrls.includes(origin)) return callback(null, true)
      return callback(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  if (!isProduction) {
    const documentFactory = () =>
      wrapResponseEnvelope(
        SwaggerModule.createDocument(app, buildSwaggerConfig()),
      )
    SwaggerModule.setup('api', app, documentFactory, {
      swaggerOptions: { persistAuthorization: true },
    })
  }

  await app.listen(port)
}
bootstrap().catch(console.error)
