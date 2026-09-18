#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const serviceDirs = readdirSync(path.join(root, 'services'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
const serviceSet = new Set(serviceDirs)
const packageNames = new Map()
const workspacePackages = new Set()
const reverseDependencies = new Map()

for (const service of serviceDirs) {
  const manifestFile = path.join(root, 'services', service, 'package.json')
  if (!existsSync(manifestFile)) continue
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  const packageName = manifest.name ?? service
  packageNames.set(service, packageName)
  workspacePackages.add(packageName)
}

for (const packageDir of readdirSync(path.join(root, 'packages'), { withFileTypes: true })) {
  if (!packageDir.isDirectory()) continue
  const manifestFile = path.join(root, 'packages', packageDir.name, 'package.json')
  if (!existsSync(manifestFile)) continue
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  if (manifest.name) workspacePackages.add(manifest.name)
}

for (const service of serviceDirs) {
  const manifestFile = path.join(root, 'services', service, 'package.json')
  if (!existsSync(manifestFile)) continue
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  const dependencies = Object.keys({
    ...manifest.dependencies,
    ...manifest.optionalDependencies,
    ...manifest.devDependencies,
  })
  for (const dependency of dependencies) {
    if (!workspacePackages.has(dependency)) continue
    const dependents = reverseDependencies.get(dependency) ?? new Set()
    dependents.add(service)
    reverseDependencies.set(dependency, dependents)
  }
}

function allServices() {
  return new Set(serviceDirs)
}

function changedFiles(base) {
  if (!base || /^0+$/.test(base)) throw new Error('missing usable base revision')
  execFileSync('git', ['cat-file', '-e', `${base}^{commit}`], { stdio: 'ignore' })
  return execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {
    encoding: 'utf8',
  })
    .split(/\r?\n/)
    .map((file) => file.replaceAll('\\', '/'))
    .filter(Boolean)
}

function select(files) {
  const selected = new Set()
  const changedPackages = new Set()

  for (const file of files) {
    if (file.startsWith('.github/') || file === 'package.json' ||
      file === 'pnpm-lock.yaml' || file === 'pnpm-workspace.yaml') {
      return allServices()
    }
    if (file.startsWith('.changeset/')) continue

    const serviceMatch = file.match(/^services\/([^/]+)\//)
    if (serviceMatch && serviceSet.has(serviceMatch[1])) {
      selected.add(serviceMatch[1])
      changedPackages.add(packageNames.get(serviceMatch[1]) ?? serviceMatch[1])
      continue
    }

    const clientMatch = file.match(/^packages\/(api-[^/]+)\//)
    if (clientMatch) {
      const packageName = `@mts241alikhlash/${clientMatch[1]}`
      const service = packageName.replace(/^@mts241alikhlash\/api-/, '') + '-service'
      if (serviceSet.has(service)) {
        selected.add(service)
        changedPackages.add(packageName)
        continue
      }
    }

    const contractMatch = file.match(/^contracts\/([^/]+)\//)
    if (contractMatch && serviceSet.has(`${contractMatch[1]}-service`)) {
      const service = `${contractMatch[1]}-service`
      selected.add(service)
      changedPackages.add(`@mts241alikhlash/api-${contractMatch[1]}`)
      continue
    }

    if (
      file.startsWith('services/') ||
      file.startsWith('packages/') ||
      file.startsWith('contracts/')
    ) {
      return allServices()
    }
  }

  let changed = true
  while (changed) {
    changed = false
    for (const packageName of changedPackages) {
      for (const dependent of reverseDependencies.get(packageName) ?? []) {
        if (selected.has(dependent)) continue
        selected.add(dependent)
        changedPackages.add(packageNames.get(dependent) ?? dependent)
        changed = true
      }
    }
  }

  return selected
}

function selectRelease(files) {
  const selected = new Set()

  for (const file of files) {
    if (file.startsWith('.github/') || file === 'package.json' ||
      file === 'pnpm-lock.yaml' || file === 'pnpm-workspace.yaml') {
      return allServices()
    }
    if (file.startsWith('.changeset/')) continue

    const clientSource = file.match(/^packages\/(api-[^/]+)\//)
    if (clientSource) {
      const service = clientSource[1].replace(/^api-/, '') + '-service'
      if (serviceSet.has(service)) {
        selected.add(service)
        continue
      }
    }

    const serviceSource = file.match(/^services\/([^/]+)\//)
    if (serviceSource && serviceSet.has(serviceSource[1])) {
      selected.add(serviceSource[1])
      continue
    }

    const contractSource = file.match(/^contracts\/([^/]+)\//)
    if (contractSource && serviceSet.has(`${contractSource[1]}-service`)) {
      selected.add(`${contractSource[1]}-service`)
      continue
    }

    if (
      file.startsWith('services/') ||
      file.startsWith('packages/') ||
      file.startsWith('contracts/')
    ) {
      return allServices()
    }
  }

  return selected
}

if (process.argv.includes('--self-check')) {
  assert.deepEqual([...select(['services/academic-service/src/main.ts'])], ['academic-service'])
  assert.deepEqual([...select(['packages/api-identity/src/generated.ts'])], ['identity-service'])
  assert.deepEqual(
    [...selectRelease(['services/academic-service/package.json'])],
    ['academic-service'],
  )
  assert.deepEqual(
    [...selectRelease(['packages/api-identity/package.json'])],
    ['identity-service'],
  )
  assert.deepEqual(
    [...selectRelease(['contracts/academic/openapi.json'])],
    ['academic-service'],
  )
  assert.deepEqual([...selectRelease(['.changeset/release.md'])], [])
  assert.deepEqual(
    [...selectRelease(['services/academic-service/package.json'])],
    ['academic-service'],
  )
  assert.equal(selectRelease(['packages/api-unknown/package.json']).size, serviceDirs.length)
  assert.equal(selectRelease(['services/unknown-service/src/main.ts']).size, serviceDirs.length)
  assert.deepEqual([...select(['docs/README.md'])], [])
  console.log('affected service self-check passed')
  process.exit(0)
}

const base = process.argv[2]
let selected
try {
  const files = changedFiles(base)
  selected = process.argv.includes('--release-json') ? selectRelease(files) : select(files)
} catch {
  selected = allServices()
}

const result = [...selected].sort()
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result))
} else if (result.length === 0) {
  console.log('none')
} else {
  console.log(result.map((service) => `--filter ${service}`).join(' '))
}
