import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import openapiTS, {
  COMMENT_HEADER,
  astToString,
} from 'openapi-typescript'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const contractsRoot = path.join(root, 'contracts')
const packagesRoot = path.join(root, 'packages')
const check = process.argv.includes('--check')
const services = [
  'academic',
  'admission',
  'assessment',
  'hr',
  'identity',
  'inventory',
  'portal',
  'presence',
  'student',
]

const tsconfig = `${JSON.stringify(
  {
    compilerOptions: {
      module: 'nodenext',
      moduleResolution: 'nodenext',
      target: 'ES2023',
      strict: true,
      skipLibCheck: true,
      noEmit: true,
    },
    include: ['src/**/*.ts'],
  },
  null,
  2,
)}\n`

const client = `import createClient from 'openapi-fetch'\nimport type { paths } from './generated.js'\n\nexport type ApiClientOptions = {\n  baseUrl: string\n  fetch?: typeof globalThis.fetch\n  headers?: HeadersInit\n}\n\nexport function createApiClient({\n  baseUrl,\n  fetch,\n  headers,\n}: ApiClientOptions) {\n  return createClient<paths>({\n    baseUrl,\n    ...(fetch ? { fetch } : {}),\n    headers,\n  })\n}\n`

const index = `export { createApiClient } from './client.js'\nexport type { ApiClientOptions } from './client.js'\nexport type { components, operations, paths } from './generated.js'\n`

async function same(pathname, expected) {
  return (await readFile(pathname, 'utf8').catch(() => null)) === expected
}

async function writeOrCheck(pathname, contents) {
  if (check) {
    if (!(await same(pathname, contents))) {
      throw new Error(`stale generated file: ${path.relative(root, pathname)}`)
    }
    return
  }
  await writeFile(pathname, contents, 'utf8')
}

for (const service of services) {
  const packageDir = path.join(packagesRoot, `api-${service}`)
  const contract = path.join(contractsRoot, service, 'openapi.json')
  const generated = path.join(packageDir, 'src', 'generated.ts')
  const generatedDir = path.dirname(generated)
  await mkdir(generatedDir, { recursive: true })

  if (!existsSync(contract)) {
    throw new Error(`missing OpenAPI contract: ${path.relative(root, contract)}`)
  }

  const schema = JSON.parse(await readFile(contract, 'utf8'))
  const generatedContents = `${COMMENT_HEADER}${astToString(
    await openapiTS(schema, { alphabetize: true, cwd: root }),
  )}`
  if (check) {
    if (!(await same(generated, generatedContents))) {
      throw new Error(`stale generated file: ${path.relative(root, generated)}`)
    }
  } else {
    await writeFile(generated, generatedContents, 'utf8')
  }

  await writeOrCheck(path.join(generatedDir, 'client.ts'), client)
  await writeOrCheck(path.join(generatedDir, 'index.ts'), index)
  await writeOrCheck(path.join(packageDir, 'tsconfig.json'), tsconfig)

  const readme = `# @mts241alikhlash/api-${service}\n\nGenerated from contracts/${service}/openapi.json.\n\nRun \`pnpm api:generate\` from the services repository root.\n`
  await writeOrCheck(path.join(packageDir, 'README.md'), readme)
  console.log(`${check ? 'client current' : 'client written'}: @mts241alikhlash/api-${service}`)
}
