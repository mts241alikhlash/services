import type { OpenAPIObject } from '@nestjs/swagger'
import { wrapResponseEnvelope } from './wrap-response-envelope.js'

function documentReturning(
  schemaName: string,
  properties: object,
): OpenAPIObject {
  return {
    openapi: '3.0.0',
    info: { title: 'test', version: '1' },
    paths: {
      '/things': {
        get: {
          responses: {
            '200': {
              description: '',
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${schemaName}` },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: { [schemaName]: { type: 'object', properties } as never },
    },
  }
}

function dataOf(document: OpenAPIObject) {
  const schema = document.paths['/things'].get?.responses['200'] as unknown as {
    content: { 'application/json': { schema: { properties: object } } }
  }
  return schema.content['application/json'].schema.properties
}

describe('wrapResponseEnvelope', () => {
  it('documents a lone { data } body as the data the interceptor sends, not wrapped twice', () => {
    const list = { type: 'array', items: { type: 'string' } }
    const document = wrapResponseEnvelope(
      documentReturning('ThingIdsResponseDto', { data: list }),
    )

    expect(dataOf(document)).toMatchObject({ data: list })
  })

  it('keeps a plain body as the envelope data', () => {
    const document = wrapResponseEnvelope(
      documentReturning('ThingResponseDto', { id: { type: 'string' } }),
    )

    expect(dataOf(document)).toMatchObject({
      data: { $ref: '#/components/schemas/ThingResponseDto' },
    })
  })
})
