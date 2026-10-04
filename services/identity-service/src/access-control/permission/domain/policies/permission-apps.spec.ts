import { SYSTEM_PERMISSIONS } from '../../constants/permission-codes.constants.js'
import {
  PERMISSION_APPS,
  appForModule,
  classifiedModules,
  isModuleClassified,
} from './permission-apps.policy.js'

describe('permission applications', () => {
  const modules = [...new Set(SYSTEM_PERMISSIONS.map((p) => p.module))].sort()

  it('classifies every module in the catalogue', () => {
    const unclassified = modules.filter((m) => !isModuleClassified(m))

    expect(unclassified).toEqual([])
  })

  it('classifies nothing that is not in the catalogue', () => {
    const known = new Set(modules)
    const stale = classifiedModules().filter((m) => !known.has(m))

    expect(stale).toEqual([])
  })

  it('files the unprefixed presence modules under presence', () => {
    for (const module of [
      'leave-requests',
      'leave-types',
      'work-patterns',
      'non-working-days',
    ]) {
      expect(appForModule(module)).toBe('presence')
    }
  })

  it('keeps the keys to the building in the system group', () => {
    for (const module of ['roles', 'permissions', 'users', 'sessions']) {
      expect(appForModule(module)).toBe('platform')
    }
  })

  it('falls back to the group handed out sparingly, not to academic', () => {
    expect(appForModule('a-module-nobody-classified')).toBe('platform')
  })

  it('offers every app key as a labelled group', () => {
    const labelled = new Set(PERMISSION_APPS.map((a) => a.key))
    const used = new Set(modules.map((m) => appForModule(m)))

    for (const app of used) {
      expect(labelled).toContain(app)
    }
  })
})
