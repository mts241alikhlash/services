import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash } from 'node:crypto'
import { Identity, IIdentityPort } from './identity.port.js'
import { parseIdentityResponse } from './identity-response.js'

interface CacheEntry {
  identity: Identity | null
  expiresAt: number
}

@Injectable()
export class HttpIdentityAdapter implements IIdentityPort {
  private readonly logger = new Logger(HttpIdentityAdapter.name)
  private readonly cache = new Map<string, CacheEntry>()
  private readonly pending = new Map<string, Promise<Identity | null>>()

  constructor(private readonly config: ConfigService) {}

  async resolve(accessToken: string): Promise<Identity | null> {
    const key = createHash('sha256').update(accessToken).digest('hex')
    const existing = this.pending.get(key)
    if (existing) return structuredClone(await existing)

    const maximum = this.config.get<number>(
      'IDENTITY_MAX_CONCURRENT_REQUESTS',
      100,
    )
    const cached = this.cache.get(key)
    if (cached && cached.expiresAt > Date.now())
      return structuredClone(cached.identity)
    this.cache.delete(key)
    if (this.pending.size >= maximum) {
      throw new ServiceUnavailableException(
        'Identity verification capacity exceeded.',
      )
    }

    const request = this.resolveRemote(accessToken, key)
    this.pending.set(key, request)
    try {
      return structuredClone(await request)
    } finally {
      this.pending.delete(key)
    }
  }

  private async resolveRemote(
    accessToken: string,
    key: string,
  ): Promise<Identity | null> {
    const ttl = this.config.get<number>('IDENTITY_CACHE_TTL_MS', 5000)
    const now = Date.now()

    const cached = this.cache.get(key)
    if (cached && cached.expiresAt > now) {
      return cached.identity
    }

    const base = this.config.get<string>('IDENTITY_SERVICE_URL')
    if (!base) {
      throw new ServiceUnavailableException(
        'IDENTITY_SERVICE_URL is not configured, so no request can be authorized.',
      )
    }

    let response: Response
    try {
      response = await fetch(`${base.replace(/\/+$/, '')}/auth/introspect`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: accessToken }),
        signal: AbortSignal.timeout(
          this.config.get<number>('IDENTITY_TIMEOUT_MS', 3000),
        ),
        redirect: 'error',
      })
    } catch {
      this.logger.error('identity-service request failed or timed out')
      throw new ServiceUnavailableException(
        'The identity service could not be reached, so this request cannot be authorized.',
      )
    }

    if (!response.ok) {
      this.logger.error(`identity-service answered ${response.status}`)
      throw new ServiceUnavailableException(
        'The identity service could not answer, so this request cannot be authorized.',
      )
    }

    const body: unknown = await response.json().catch(() => null)
    const identity = parseIdentityResponse(body)

    if (ttl > 0) {
      this.sweep(Date.now())
      const maximum = this.config.get<number>(
        'IDENTITY_CACHE_MAX_ENTRIES',
        1000,
      )
      while (this.cache.size >= maximum) {
        for (const oldest of this.cache.keys()) {
          this.cache.delete(oldest)
          break
        }
      }
      if (now + ttl > Date.now()) {
        this.cache.set(key, { identity, expiresAt: now + ttl })
      }
    }

    return identity
  }

  private sweep(now: number): void {
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) this.cache.delete(key)
    }
  }
}
