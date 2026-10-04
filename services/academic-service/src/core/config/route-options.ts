import type { NestApplicationOptions } from '@nestjs/common'

export const ROUTE_OPTIONS = {
  routeConflictPolicy: { duplicate: 'error', shadow: 'warn' },
  routeResolutionStrategy: 'specificity',
} as const satisfies NestApplicationOptions
