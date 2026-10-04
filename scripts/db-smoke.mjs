#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const serverUrl = process.env.SMOKE_DATABASE_URL
if (!serverUrl) {
  throw new Error(
    'SMOKE_DATABASE_URL is required, e.g. postgresql://postgres:pg@localhost:5432/postgres',
  )
}

const fromIdentity = createRequire(
  path.join(root, 'services/identity-service/package.json'),
)
const { Client } = createRequire(fromIdentity.resolve('@prisma/adapter-pg'))(
  'pg',
)

const services = readdirSync(path.join(root, 'services')).filter((name) =>
  existsSync(path.join(root, 'services', name, 'prisma/migrations')),
)

const databaseOf = (service) => `smoke_${service.replace(/-/g, '_')}`

function urlFor(database) {
  const url = new URL(serverUrl)
  url.pathname = `/${database}`
  url.searchParams.set('sslmode', 'disable')
  return url.toString()
}

async function sql(database, text, params = []) {
  const client = new Client({ connectionString: urlFor(database) })
  await client.connect()
  try {
    return (await client.query(text, params)).rows
  } finally {
    await client.end()
  }
}

async function count(database, table, where = '') {
  const [row] = await sql(
    database,
    `SELECT count(*)::int AS n FROM "${table}" ${where}`,
  )
  return row.n
}

function inService(service, args, env = {}) {
  const database = urlFor(databaseOf(service))
  execFileSync('pnpm', ['--filter', service, 'exec', ...args], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'inherit'],
    env: {
      ...process.env,
      DATABASE_URL: database,
      DIRECT_URL: database,
      ...env,
    },
  })
}


const postgresDatabase = new URL(serverUrl).pathname.slice(1) || 'postgres'

for (const service of services) {
  const database = databaseOf(service)
  await sql(postgresDatabase, `DROP DATABASE IF EXISTS "${database}"`)
  await sql(postgresDatabase, `CREATE DATABASE "${database}"`)
  inService(service, ['prisma', 'migrate', 'deploy'])
  inService(service, ['prisma', 'migrate', 'deploy'])
  console.log(`migrated twice: ${service}`)
}

const expected = [
  ['identity-service', 'religions', 6],
  ['identity-service', 'blood_types', 8],
  ['academic-service', 'occupations', 13],
  ['academic-service', 'educations', 10],
  ['academic-service', 'scholarship_categories', 5],
  ['admission-service', 'admission_document_types', 7],
  ['hr-service', 'employment_types', 6],
  ['hr-service', 'position_categories', 3],
  ['hr-service', 'positions', 15],
  ['inventory-service', 'inventory_categories', 7],
  ['inventory-service', 'inventory_conditions', 3],
  ['inventory-service', 'inventory_funding_sources', 5],
  ['presence-service', 'leave_types', 8],
  ['portal-service', 'portal_post_categories', 4],
  ['portal-service', 'portal_homepage_sections', 4],
  ['portal-service', 'portal_nav_items', 5],
]
for (const [service, table, rows] of expected) {
  assert.equal(await count(databaseOf(service), table), rows, `${service} ${table}`)
}
const regions = await sql(
  databaseOf('identity-service'),
  'SELECT level::text AS name, count(*)::int AS n FROM regions GROUP BY level ORDER BY level',
)
assert.deepEqual(
  regions.map((row) => [row.name, row.n]),
  [
    ['PROVINCE', 38],
    ['REGENCY', 514],
    ['DISTRICT', 7285],
    ['VILLAGE', 83762],
  ],
  'identity regions',
)
console.log('default reference data: counts match')

const identity = databaseOf('identity-service')


const seedEnv = { SEED_ADMIN_PASSWORD: 'smoke-admin-password' }
inService('identity-service', ['tsx', 'prisma/seed-admin-minimal.ts'], seedEnv)
inService('identity-service', ['tsx', 'prisma/seed-permissions.ts'])

assert.equal(await count(identity, 'roles'), 25, 'four structural and twenty-one default roles')
const applicantGrants = await sql(
  identity,
  `SELECT p.code FROM role_permissions rp
   JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id
   WHERE r.code = 'APPLICANT'`,
)
assert.deepEqual(applicantGrants.map((row) => row.code), ['admissions.apply'])
const staffApplying = await sql(
  identity,
  `SELECT r.code FROM role_permissions rp
   JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id
   WHERE p.code = 'admissions.apply' AND r.code NOT IN ('APPLICANT', 'SUPER_ADMIN')`,
)
assert.deepEqual(staffApplying, [], 'no staff role can apply for admission')
console.log('identity: twenty-five roles, applying kept to applicants')

await sql(
  identity,
  `DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE code = 'HR_ADMIN')
   AND permission_id = (SELECT id FROM permissions WHERE code = 'positions.delete')`,
)
const hrBefore = await count(
  identity,
  'role_permissions',
  `WHERE role_id = (SELECT id FROM roles WHERE code = 'HR_ADMIN')`,
)
await sql(
  identity,
  `INSERT INTO user_roles (user_id, role_id)
   SELECT u.id, r.id FROM users u, roles r WHERE u.identifier = 'admin' AND r.code = 'OPERATOR'`,
)
inService('identity-service', ['tsx', 'prisma/seed-permissions.ts'])
inService('identity-service', ['tsx', 'prisma/seed-admin-minimal.ts'], seedEnv)
assert.equal(
  await count(
    identity,
    'role_permissions',
    `WHERE role_id = (SELECT id FROM roles WHERE code = 'HR_ADMIN')`,
  ),
  hrBefore,
  'a school edit to a default role survives the next sync',
)
const adminRoles = await sql(
  identity,
  `SELECT r.code FROM user_roles ur JOIN roles r ON r.id = ur.role_id
   JOIN users u ON u.id = ur.user_id WHERE u.identifier = 'admin' ORDER BY r.code`,
)
assert.deepEqual(
  adminRoles.map((row) => row.code),
  ['OPERATOR', 'SUPER_ADMIN'],
  'reseeding the admin keeps its other roles',
)
console.log('identity: edits and role assignments survive reseeding')

for (const service of services) {
  await sql(postgresDatabase, `DROP DATABASE IF EXISTS "${databaseOf(service)}"`)
}
console.log('db smoke passed')
