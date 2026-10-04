import { DocumentBuilder } from '@nestjs/swagger'

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Employee Service API')
    .setDescription('Employee Service')
    .setVersion(process.env.OPENAPI_VERSION ?? '0.1.0')
    .addBearerAuth()
    .build()
}
