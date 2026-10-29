import { SYSTEM_PERMISSIONS } from '../../constants/permission-codes.constants.js'
import {
  PERMISSION_APPS,
  appForModule,
  classifiedModules,
  isModuleClassified,
} from './permission-apps.policy.js'

describe('permission applications', () => {
  const modules = [...new Set(SYSTEM_PERMISSIONS.map((p) => p.module))].sort()

  it('classifies every module in the catalog', () => {
    const unclassified = modules.filter((m) => !isModuleClassified(m))

    expect(unclassified).toEqual([])
  })

  it('classifies nothing that is not in the catalog', () => {
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

  it('files the exam package and schedule modules under academic', () => {
    for (const module of ['exam-packages', 'exam-schedules']) {
      expect(appForModule(module)).toBe('academic')
    }
  })

  it('files the exam session module under academic', () => {
    expect(appForModule('exam-sessions')).toBe('academic')
    expect(appForModule('exam-grading')).toBe('academic')
    expect(appForModule('exam-scores')).toBe('academic')
  })

  it('keeps the keys to the building in the system group', () => {
    for (const module of ['roles', 'permissions', 'users', 'sessions']) {
      expect(appForModule(module)).toBe('platform')
    }
  })

  it('falls back to the group handed out sparingly, not to academic', () => {
    expect(appForModule('a-module-nobody-classified')).toBe('platform')
  })

  it('offers every app key as a labeled group', () => {
    const labeled = new Set(PERMISSION_APPS.map((a) => a.key))
    const used = new Set(modules.map((m) => appForModule(m)))

    for (const app of used) {
      expect(labeled).toContain(app)
    }
  })
})
