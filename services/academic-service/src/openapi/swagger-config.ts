import { DocumentBuilder } from '@nestjs/swagger'

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Academic Service API')
    .setDescription('Academic Service')
    .setVersion(process.env.OPENAPI_VERSION ?? '0.1.0')
    .addBearerAuth()
    .build()
}
