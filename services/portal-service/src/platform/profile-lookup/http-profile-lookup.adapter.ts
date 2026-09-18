import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IProfileLookupPort, ProfileSummary } from './profile-lookup.port.js'
import { parseProfiles } from './profile-response.js'

const MAX_BATCH_SIZE = 200
const REQUEST_TIMEOUT_MS = 10_000

interface CacheEntry {
  profile: ProfileSummary | null
  expiresAt: number
}

@Injectable()
export class HttpProfileLookupAdapter extends IProfileLookupPort {
  private readonly logger = new Logger(HttpProfileLookupAdapter.name)
  private readonly cache = new Map<string, CacheEntry>()

  constructor(private readonly config: ConfigService) {
    super()
  }

  async findByUserIds(userIds: string[]): Promise<ProfileSummary[]> {
    if (userIds.length === 0) return []

    const ttl = this.config.get<number>('PROFILE_LOOKUP_CACHE_TTL_MS', 60_000)
    const now = Date.now()
    const uniqueIds = [...new Set(userIds)]

    const resolved: ProfileSummary[] = []
    const missing: string[] = []

    for (const userId of uniqueIds) {
      const cached = this.cache.get(userId)
      if (cached && cached.expiresAt > now) {
        if (cached.profile) resolved.push({ ...cached.profile })
      } else {
        missing.push(userId)
      }
    }

    if (missing.length > 0) {
      const fetched = await this.fetchAndCache(missing, ttl, now)
      resolved.push(...fetched)
    }

    return resolved
  }

  private async fetchAndCache(
    userIds: string[],
    ttl: number,
    now: number,
  ): Promise<ProfileSummary[]> {
    const chunks: string[][] = []
    for (let i = 0; i < userIds.length; i += MAX_BATCH_SIZE) {
      chunks.push(userIds.slice(i, i + MAX_BATCH_SIZE))
    }

    const results: ProfileSummary[][] = []
    for (const chunk of chunks) {
      results.push(await this.fetchChunk(chunk))
    }
    const profiles = results.flat()

    if (ttl > 0) {
      this.sweep(Date.now())
      const maximum = this.config.get<number>(
        'PROFILE_LOOKUP_CACHE_MAX_ENTRIES',
        1000,
      )
      const byUserId = new Map(profiles.map((p) => [p.userId, p]))
      for (const userId of userIds) {
        if (now + ttl <= Date.now()) break
        this.cache.delete(userId)
        if (this.cache.size >= maximum) {
          for (const oldest of this.cache.keys()) {
            this.cache.delete(oldest)
            break
          }
        }
        this.cache.set(userId, {
          profile: byUserId.has(userId) ? { ...byUserId.get(userId)! } : null,
          expiresAt: now + ttl,
        })
      }
      this.sweep(now)
    }

    return profiles
  }

  private async fetchChunk(userIds: string[]): Promise<ProfileSummary[]> {
    const base = this.config.get<string>('IDENTITY_SERVICE_URL')
    if (!base) {
      throw new ServiceUnavailableException(
        'IDENTITY_SERVICE_URL is not configured, so no profile can be resolved.',
      )
    }

    const token = this.config.get<string>('PROVISIONING_SERVICE_TOKEN')
    if (!token) {
      throw new ServiceUnavailableException(
        'PROVISIONING_SERVICE_TOKEN is not configured, so no profile can be resolved.',
      )
    }

    let response: Response
    try {
      response = await fetch(`${base.replace(/\/+$/, '')}/profiles/batch`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-provisioning-token': token,
        },
        body: JSON.stringify({ userIds }),
        signal: AbortSignal.timeout(
          this.config.get<number>('IDENTITY_TIMEOUT_MS', REQUEST_TIMEOUT_MS),
        ),
        redirect: 'error',
      })
    } catch {
      this.logger.error('identity-service profile request failed or timed out')
      throw new ServiceUnavailableException(
        'The identity service could not be reached, so these profiles cannot be resolved.',
      )
    }

    if (!response.ok) {
      this.logger.error(
        `identity-service answered ${response.status} for /profiles/batch`,
      )
      throw new ServiceUnavailableException(
        'The identity service could not resolve these profiles.',
      )
    }

    const body: unknown = await response.json().catch(() => null)
    return parseProfiles(body, userIds)
  }

  private sweep(now: number): void {
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) this.cache.delete(key)
    }
  }
}
