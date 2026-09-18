import type {
  OpenAPIObject,
  OperationObject,
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger'

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const

const ENVELOPE_META_PROPERTIES: Record<string, SchemaObject> = {
  statusCode: { type: 'integer', example: 200 },
  message: { type: 'string', example: 'Success' },
}

function isReferenceObject(
  schema: SchemaObject | ReferenceObject,
): schema is ReferenceObject {
  return '$ref' in schema
}

function resolveSchema(
  schema: SchemaObject | ReferenceObject,
  schemas: Record<string, SchemaObject | ReferenceObject>,
): SchemaObject | undefined {
  if (!isReferenceObject(schema)) return schema
  const name = schema.$ref.replace('#/components/schemas/', '')
  const resolved = schemas[name]
  return resolved && !isReferenceObject(resolved) ? resolved : undefined
}

function envelopeSchemaFor(
  schema: SchemaObject | ReferenceObject,
  schemas: Record<string, SchemaObject | ReferenceObject>,
): SchemaObject {
  const properties = resolveSchema(schema, schemas)?.properties

  if (properties?.data && properties.meta) {
    return {
      type: 'object',
      properties: {
        ...ENVELOPE_META_PROPERTIES,
        data: properties.data,
        meta: properties.meta,
      },
    }
  }

  if (
    properties?.data &&
    properties.total &&
    properties.page &&
    properties.limit
  ) {
    return {
      type: 'object',
      properties: {
        ...ENVELOPE_META_PROPERTIES,
        data: properties.data,
        meta: {
          type: 'object',
          properties: {
            total: properties.total,
            page: properties.page,
            limit: properties.limit,
            ...(properties.summary ? { summary: properties.summary } : {}),
          },
        },
      },
    }
  }

  return {
    type: 'object',
    properties: {
      ...ENVELOPE_META_PROPERTIES,
      data: schema,
    },
  }
}

function wrapOperationResponses(
  operation: OperationObject,
  schemas: Record<string, SchemaObject | ReferenceObject>,
): void {
  for (const [status, response] of Object.entries(operation.responses)) {
    const code = Number(status)
    if (!response || isReferenceObject(response)) continue
    if (code < 200 || code >= 300) continue

    const media = response.content?.['application/json']
    if (!media?.schema) continue

    media.schema = envelopeSchemaFor(media.schema, schemas)
  }
}

export function wrapResponseEnvelope(document: OpenAPIObject): OpenAPIObject {
  const schemas = document.components?.schemas ?? {}

  for (const pathItem of Object.values(document.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]
      if (!operation) continue
      wrapOperationResponses(operation, schemas)
    }
  }

  return document
}
