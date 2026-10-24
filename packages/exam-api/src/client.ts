import createClient from 'openapi-fetch'
import type { paths } from './generated.js'

export type ApiClientOptions = {
  baseUrl: string
  fetch?: typeof globalThis.fetch
  headers?: HeadersInit
}

export function createApiClient({
  baseUrl,
  fetch,
  headers,
}: ApiClientOptions) {
  return createClient<paths>({
    baseUrl,
    ...(fetch ? { fetch } : {}),
    headers,
  })
}
