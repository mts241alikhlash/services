import { cp, mkdir, readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const servicesRoot = path.join(root, 'services')
const contractsRoot = path.join(root, 'contracts')
const check = process.argv.includes('--check')
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const services = (await readdir(servicesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

const env = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ?? 'postgresql://build:build@127.0.0.1:5432/build',
  DIRECT_URL:
    process.env.DIRECT_URL ?? 'postgresql://build:build@127.0.0.1:5432/build',
  JWT_SECRET: process.env.JWT_SECRET ?? 'build-only-secret-123456789',
  PROVISIONING_SERVICE_TOKEN:
    process.env.PROVISIONING_SERVICE_TOKEN ??
    'build-only-provisioning-token-123456789',
  IDENTITY_SERVICE_URL:
    process.env.IDENTITY_SERVICE_URL ?? 'http://identity-service:3000',
  ACADEMIC_SERVICE_URL:
    process.env.ACADEMIC_SERVICE_URL ?? 'http://academic-service:3200',
  ADMISSION_SERVICE_URL:
    process.env.ADMISSION_SERVICE_URL ?? 'http://admission-service:3700',
  INVENTORY_SERVICE_URL:
    process.env.INVENTORY_SERVICE_URL ?? 'http://inventory-service:3300',
  PORTAL_SERVICE_URL:
    process.env.PORTAL_SERVICE_URL ?? 'http://portal-service:3600',
  PRESENCE_SERVICE_URL:
    process.env.PRESENCE_SERVICE_URL ?? 'http://presence-service:3400',
  HR_SERVICE_URL: process.env.HR_SERVICE_URL ?? 'http://hr-service:3800',
  STUDENT_SERVICE_URL:
    process.env.STUDENT_SERVICE_URL ?? 'http://student-service:3900',
  ASSESSMENT_SERVICE_URL:
    process.env.ASSESSMENT_SERVICE_URL ?? 'http://assessment-service:4000',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? 'build-google-client-id',
  GOOGLE_CLIENT_SECRET:
    process.env.GOOGLE_CLIENT_SECRET ?? 'build-google-client-secret',
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL ??
    'http://localhost:3000/auth/google/callback',
  GOOGLE_OAUTH_SUCCESS_REDIRECT_URL:
    process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT_URL ?? 'http://localhost:5173',
  S3_ENDPOINT: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  S3_PUBLIC_ENDPOINT:
    process.env.S3_PUBLIC_ENDPOINT ?? 'http://localhost:9000',
  S3_BUCKET: process.env.S3_BUCKET ?? 'build',
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ?? 'build',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ?? 'build',
}

function run(args, service) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'cmd.exe' : pnpm
    const commandArgs =
      process.platform === 'win32'
        ? ['/d', '/s', '/c', `${pnpm} ${args.join(' ')}`]
        : args
    const child = spawn(command, commandArgs, {
      cwd: root,
      env,
      stdio: 'inherit',
      shell: false,
    })
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) return resolve()
      reject(
        new Error(
          `${service}: ${args.join(' ')} failed with ${signal ?? `exit ${code}`}`,
        ),
      )
    })
  })
}

for (const service of services) {
  const source = path.join(servicesRoot, service, 'openapi.json')
  const targetDir = path.join(contractsRoot, service.replace(/-service$/, ''))
  const target = path.join(targetDir, 'openapi.json')

  const servicePackage = JSON.parse(
    await readFile(path.join(servicesRoot, service, 'package.json'), 'utf8'),
  )
  env.OPENAPI_VERSION = servicePackage.version
  await run(['--filter', service, 'run', 'prisma:generate'], service)
  await run(['--filter', service, 'run', 'openapi:emit'], service)

  if (!existsSync(source)) {
    throw new Error(`${service}: emitter did not create ${source}`)
  }
  const generated = JSON.parse(await readFile(source, 'utf8'))
  if (generated.info?.version !== servicePackage.version) {
    throw new Error(
      `${service}: generated OpenAPI info.version ${generated.info?.version} does not match package version ${servicePackage.version}`,
    )
  }
  if (check) {
    const tracked = await readFile(target, 'utf8').catch(() => null)
    if (`${JSON.stringify(generated, null, 2)}\n` !== tracked) {
      throw new Error(`${service}: tracked OpenAPI contract is stale`)
    }
    console.log(`contract current: ${path.relative(root, target)}`)
  } else {
    await mkdir(targetDir, { recursive: true })
    await cp(source, target)
    console.log(`contract written: ${path.relative(root, target)}`)
  }
}
