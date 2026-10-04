process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://mock:mock@localhost:5432/mock'
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'super-secret-jwt-secret-min-16-chars'
process.env.PROVISIONING_SERVICE_TOKEN =
  process.env.PROVISIONING_SERVICE_TOKEN ||
  'super-secret-provisioning-token-mock'
process.env.GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id'
process.env.GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret'
process.env.GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  'http://localhost:3000/auth/google/callback'
process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT_URL =
  process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT_URL ||
  'http://localhost:5173/auth/callback'

import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'
import { buildSwaggerConfig } from './swagger-config.js'
import { wrapResponseEnvelope } from './wrap-response-envelope.js'

async function main(): Promise<void> {
  const { AppModule } = await import('../app.module.js')
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  })

  const document = wrapResponseEnvelope(
    SwaggerModule.createDocument(app, buildSwaggerConfig()),
  )
  const target = resolve(process.cwd(), 'openapi.json')

  await writeFile(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
  await app.close()

  const paths = Object.keys(document.paths ?? {}).length
  const schemas = Object.keys(document.components?.schemas ?? {}).length
  console.log(`openapi.json written: ${paths} paths, ${schemas} schemas`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
