import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const scopes = {
  services(file) {
    return (
      /^(services|packages|contracts)\//.test(file) ||
      /^(package.json|pnpm-lock.yaml|pnpm-workspace.yaml|\.node-version)$/.test(file)
    )
  },
  packages(file) {
    return (
      /^packages\//.test(file) ||
      /^(package.json|pnpm-lock.yaml|pnpm-workspace.yaml|\.node-version)$/.test(file)
    )
  },
  app(file) {
    return (
      /^(src|packages|public|scripts|nginx)\//.test(file) ||
      /^(Dockerfile|index.html|package.json|pnpm-lock.yaml|pnpm-workspace.yaml|\.node-version|vite.config\.[^/]+|tailwind.config\.[^/]+|components.json)$/.test(
        file,
      )
    )
  },
}

function isChangeset(file) {
  return /^\.changeset\/(?!README\.md$)[^/]+\.md$/.test(file)
}

function releaseFiles(files, scope) {
  const matches = scopes[scope]
  if (!matches) throw new Error(`unknown scope: ${scope}`)
  return files.filter((file) => matches(file))
}

function validate(files, scope) {
  const relevant = releaseFiles(files, scope)
  if (relevant.length === 0 || files.some(isChangeset)) return
  throw new Error(
    [
      'Release-relevant changes require a Changeset.',
      ...relevant.map((file) => `- ${file}`),
    ].join('\n'),
  )
}

function selfCheck() {
  assert.equal(releaseFiles(['src/main.ts'], 'app').length, 1)
  assert.equal(releaseFiles(['README.md', 'docs/notes.md'], 'app').length, 0)
  assert.equal(releaseFiles(['services/academic-service/src/main.ts'], 'services').length, 1)
  assert.equal(releaseFiles(['packages/ui/src/index.ts'], 'packages').length, 1)
  assert.equal(isChangeset(['.changeset/release.md'][0]), true)
  assert.equal(isChangeset(['.changeset/README.md'][0]), false)
  assert.throws(() => validate(['src/main.ts'], 'app'), /require a Changeset/)
  assert.doesNotThrow(() => validate(['src/main.ts', '.changeset/fix.md'], 'app'))
  assert.doesNotThrow(() => validate(['README.md'], 'app'))
  console.log('changeset guard self-check passed')
}

if (process.argv.includes('--self-check')) {
  selfCheck()
  process.exit(0)
}

const [base, scope] = process.argv.slice(2)
if (!base || !scope) {
  console.error('usage: node require-changeset.mjs <base-sha> <services|packages|app>')
  process.exit(2)
}

const files = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {
  encoding: 'utf8',
})
  .split(/\r?\n/)
  .map((file) => file.replaceAll('\\', '/'))
  .filter(Boolean)

try {
  validate(files, scope)
  console.log('Changeset requirement satisfied')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
