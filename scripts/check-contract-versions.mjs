import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const servicesRoot = path.join(root, 'services')
const contractsRoot = path.join(root, 'contracts')
const packagesRoot = path.join(root, 'packages')
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
const errors = []

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

const services = (await readdir(servicesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

for (const service of services) {
  const serviceManifest = await readJson(
    path.join(servicesRoot, service, 'package.json'),
  )
  const serviceVersion = serviceManifest.version
  if (!semver.test(serviceVersion)) {
    errors.push(`${service}: package version is not SemVer: ${serviceVersion}`)
  }

  const contract = await readJson(
    path.join(contractsRoot, service.replace(/-service$/, ''), 'openapi.json'),
  )
  const contractVersion = contract.info?.version
  if (contractVersion !== serviceVersion) {
    errors.push(
      `${service}: OpenAPI info.version ${contractVersion} does not match package version ${serviceVersion}`,
    )
  }
}

const packages = (await readdir(packagesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('api-'))
  .map((entry) => entry.name)
  .sort()

for (const packageDir of packages) {
  const manifest = await readJson(path.join(packagesRoot, packageDir, 'package.json'))
  if (!semver.test(manifest.version)) {
    errors.push(`${manifest.name}: package version is not SemVer: ${manifest.version}`)
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error)
  process.exitCode = 1
} else {
  console.log(`contract versions valid: ${services.length} services, ${packages.length} API clients`)
}
