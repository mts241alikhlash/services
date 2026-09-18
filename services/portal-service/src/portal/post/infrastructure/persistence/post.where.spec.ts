import { ContentStatus } from '@prisma/client'
import { PostType } from '../../domain/enums/post-type.enum.js'
import {
  activeAnnouncementWhere,
  expiredAnnouncementWhere,
  PUBLIC_POST_ORDER_BY,
  publicPostListWhere,
  visiblePostWhere,
} from './post.where.js'

function matchesField(value: unknown, condition: unknown): boolean {
  if (condition === null) return value === null
  if (condition instanceof Date) {
    return value instanceof Date && value.getTime() === condition.getTime()
  }
  if (typeof condition === 'object') {
    return Object.entries(condition as Record<string, unknown>).every(
      ([operator, operand]) => {
        switch (operator) {
          case 'in':
            return (operand as unknown[]).includes(value)
          case 'not':
            return operand === null ? value !== null : value !== operand
          case 'lte':
            return (
              value instanceof Date &&
              value.getTime() <= (operand as Date).getTime()
            )
          case 'gt':
            return (
              value instanceof Date &&
              value.getTime() > (operand as Date).getTime()
            )
          default:
            throw new Error(`post.where.spec cannot evaluate "${operator}"`)
        }
      },
    )
  }
  return value === condition
}

function matches(
  row: Record<string, unknown>,
  where: Record<string, unknown>,
): boolean {
  return Object.entries(where).every(([field, condition]) => {
    if (field === 'OR') {
      return (condition as Record<string, unknown>[]).some((sub) =>
        matches(row, sub),
      )
    }
    return matchesField(row[field], condition)
  })
}

const NOW = new Date('2026-08-06T07:00:00.000Z')
const HOUR_AGO = new Date('2026-08-06T06:00:00.000Z')
const HOUR_AHEAD = new Date('2026-08-06T08:00:00.000Z')

function row(overrides: Record<string, unknown> = {}) {
  return {
    deletedAt: null,
    status: ContentStatus.PUBLISHED,
    publishedAt: HOUR_AGO,
    type: PostType.BERITA,
    expiresAt: null,
    ...overrides,
  }
}

describe('visiblePostWhere', () => {
  const where = () =>
    visiblePostWhere(NOW) as unknown as Record<string, unknown>

  it('shows a published item whose moment has passed', () => {
    expect(matches(row(), where())).toBe(true)
  })

  it('shows a SCHEDULED item whose moment has passed, with no cron having run', () => {
    const scheduled = row({
      status: ContentStatus.SCHEDULED,
      publishedAt: HOUR_AGO,
    })
    expect(matches(scheduled, where())).toBe(true)
  })

  it('hides a SCHEDULED item whose moment has not arrived', () => {
    const scheduled = row({
      status: ContentStatus.SCHEDULED,
      publishedAt: HOUR_AHEAD,
    })
    expect(matches(scheduled, where())).toBe(false)
  })

  it('shows an item published at exactly this instant', () => {
    expect(matches(row({ publishedAt: NOW }), where())).toBe(true)
  })

  it.each([
    ['DRAFT', ContentStatus.DRAFT],
    ['ARCHIVED', ContentStatus.ARCHIVED],
  ])('hides a %s item even with a past publishedAt', (_label, status) => {
    expect(matches(row({ status }), where())).toBe(false)
  })

  it('hides a soft-deleted item that was published', () => {
    expect(matches(row({ deletedAt: NOW }), where())).toBe(false)
  })

  it('hides an item with no publishedAt at all', () => {
    expect(matches(row({ publishedAt: null }), where())).toBe(false)
  })

  it('defaults to the current time when none is supplied', () => {
    const built = visiblePostWhere() as unknown as {
      publishedAt: { lte: Date }
    }
    expect(built.publishedAt.lte.getTime()).toBeLessThanOrEqual(Date.now())
  })
})

describe('publicPostListWhere', () => {
  it('keeps the visibility rule and adds the type filter', () => {
    const where = publicPostListWhere(
      PostType.ARTIKEL,
      NOW,
    ) as unknown as Record<string, unknown>

    expect(matches(row({ type: PostType.ARTIKEL }), where)).toBe(true)
    expect(matches(row({ type: PostType.BERITA }), where)).toBe(false)
    expect(
      matches(
        row({ type: PostType.ARTIKEL, status: ContentStatus.DRAFT }),
        where,
      ),
    ).toBe(false)
  })
})

const announcement = (overrides: Record<string, unknown> = {}) =>
  row({ type: PostType.PENGUMUMAN, ...overrides })

describe('activeAnnouncementWhere', () => {
  const where = () =>
    activeAnnouncementWhere(NOW) as unknown as Record<string, unknown>

  it('is active when it has no expiry', () => {
    expect(matches(announcement(), where())).toBe(true)
  })

  it('is active while its expiry is still ahead', () => {
    expect(matches(announcement({ expiresAt: HOUR_AHEAD }), where())).toBe(true)
  })

  it('drops out once its expiry has passed', () => {
    expect(matches(announcement({ expiresAt: HOUR_AGO }), where())).toBe(false)
  })

  it('drops out at exactly the expiry instant', () => {
    expect(matches(announcement({ expiresAt: NOW }), where())).toBe(false)
  })

  it('never matches a Berita', () => {
    expect(matches(announcement({ type: PostType.BERITA }), where())).toBe(
      false,
    )
  })

  it('still hides an unpublished announcement', () => {
    expect(
      matches(announcement({ status: ContentStatus.DRAFT }), where()),
    ).toBe(false)
  })
})

describe('expiredAnnouncementWhere', () => {
  const where = () =>
    expiredAnnouncementWhere(NOW) as unknown as Record<string, unknown>

  it('matches an announcement whose expiry has passed', () => {
    expect(matches(announcement({ expiresAt: HOUR_AGO }), where())).toBe(true)
  })

  it('matches at exactly the expiry instant', () => {
    expect(matches(announcement({ expiresAt: NOW }), where())).toBe(true)
  })

  it('does not match one that is still current', () => {
    expect(matches(announcement({ expiresAt: HOUR_AHEAD }), where())).toBe(
      false,
    )
  })

  it('does not match one with no expiry at all', () => {
    expect(matches(announcement({ expiresAt: null }), where())).toBe(false)
  })

  it('still hides an unpublished announcement', () => {
    expect(
      matches(
        announcement({ status: ContentStatus.DRAFT, expiresAt: HOUR_AGO }),
        where(),
      ),
    ).toBe(false)
  })

  it('partitions published announcements with the active list', () => {
    const rows = [
      announcement({ expiresAt: null }),
      announcement({ expiresAt: HOUR_AHEAD }),
      announcement({ expiresAt: HOUR_AGO }),
      announcement({ expiresAt: NOW }),
    ]

    for (const candidate of rows) {
      const inActive = matches(candidate, activeAnnouncementWhere(NOW))
      const inArchive = matches(candidate, where())
      expect(inActive !== inArchive).toBe(true)
    }
  })
})

describe('PUBLIC_POST_ORDER_BY', () => {
  it('puts pinned items first and unpinned last, then falls back to recency', () => {
    expect(PUBLIC_POST_ORDER_BY).toEqual([
      { pinnedAt: { sort: 'desc', nulls: 'last' } },
      { publishedAt: 'desc' },
    ])
  })
})
