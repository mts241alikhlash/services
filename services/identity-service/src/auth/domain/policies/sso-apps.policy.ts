import {
  appForModule,
  type PermissionApp,
} from '../../../access-control/permission/domain/policies/permission-apps.policy.js'

export const SSO_APP_KEYS = [
  'account',
  'academic',
  'admin',
  'admission',
  'assessment',
  'hr',
  'inventory',
  'portal',
] as const

export type SsoAppKey = (typeof SSO_APP_KEYS)[number]

export const SSO_APP_LABELS: Record<SsoAppKey, string> = {
  account: 'Akun',
  academic: 'Akademik',
  admin: 'Administrasi',
  admission: 'PPDB',
  assessment: 'Penilaian',
  hr: 'Kepegawaian',
  inventory: 'Inventaris',
  portal: 'Portal',
}

const PERMISSION_APPS: Record<
  Exclude<SsoAppKey, 'account'>,
  PermissionApp[]
> = {
  academic: ['academic'],
  admin: ['platform'],
  admission: ['admission'],
  assessment: ['academic'],
  hr: ['hr', 'presence', 'payroll'],
  inventory: ['inventory'],
  portal: ['portal'],
}

export interface Grants {
  roles: string[]
  permissions: string[]
}

export function isSsoAppKey(value: string): value is SsoAppKey {
  return (SSO_APP_KEYS as readonly string[]).includes(value)
}

export function isStaff(roles: string[]): boolean {
  return roles.some((role) => role !== 'APPLICANT')
}

export function isApplicant(roles: string[]): boolean {
  return roles.includes('APPLICANT')
}

export function canOpenApp(app: SsoAppKey, grants: Grants): boolean {
  if (!isStaff(grants.roles)) return false
  if (app === 'account') return true
  const wanted = PERMISSION_APPS[app]
  return grants.permissions.some((code) =>
    wanted.includes(appForModule(code.split('.')[0])),
  )
}

export function parseSsoApps(value: string): Map<SsoAppKey, string> {
  const apps = new Map<SsoAppKey, string>()
  const entries = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
  for (const entry of entries) {
    const separator = entry.indexOf('=')
    const key = entry.slice(0, separator)
    const url = entry.slice(separator + 1)
    if (separator < 1 || !isSsoAppKey(key)) {
      throw new Error(`SSO_APPS: unknown app in "${entry}"`)
    }
    if (apps.has(key)) {
      throw new Error(`SSO_APPS: ${key} is listed twice`)
    }
    try {
      new URL(url)
    } catch {
      throw new Error(`SSO_APPS: ${key} needs an absolute callback URL`)
    }
    apps.set(key, url)
  }
  if (!apps.has('account')) {
    throw new Error('SSO_APPS must register account')
  }
  return apps
}

export function safeRelativePath(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}
