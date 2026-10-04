import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import type { Cache } from 'cache-manager'

const KEY_PREFIX = 'portal:public:'

@Injectable()
export class PortalCacheService {
  private readonly logger = new Logger(PortalCacheService.name)

  private readonly keys = new Set<string>()

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(KEY_PREFIX + key) ?? undefined
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const namespaced = KEY_PREFIX + key
    await this.cache.set(namespaced, value, ttlMs)
    this.keys.add(namespaced)
  }

  async invalidate(): Promise<void> {
    const keys = [...this.keys]
    this.keys.clear()

    try {
      await Promise.all(keys.map((key) => this.cache.del(key)))
    } catch (error) {
      this.logger.warn(
        `Portal cache flush failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }
}
