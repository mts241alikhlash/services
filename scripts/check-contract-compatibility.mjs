#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const METHODS = ['delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'trace']
const BUMP_RANK = { patch: 1, minor: 2, major: 3 }
const CONTRACT_RE = /^contracts\/([^/]+)\/openapi\.json$/
const CHANGESET_RE = /^\.changeset\/(?!README\.md$)[^/]+\.md$/

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const git = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim()

function changedFiles(base) {
  if (!base || /^0+$/.test(base)) throw new Error('missing usable base revision')
  execFileSync('git', ['cat-file', '-e', `${base}^{commit}`], { stdio: 'ignore' })
  return git(['diff', '--name-only', `${base}...HEAD`])
    .split(/\r?\n/)
    .map((file) => file.replaceAll('\\', '/'))
    .filter(Boolean)
}

function currentFile(file) {
  const absolute = path.join(process.cwd(), file)
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : git(['show', `HEAD:${file}`])
}

function parseJson(text, label) {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`)
  }
}

export function parseChangeset(text) {
  const frontmatter = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
  const result = new Map()
  if (!frontmatter) return result
  for (const line of frontmatter.split(/\r?\n/)) {
    const match = line.match(/^\s*['"]?(@?[\w./-]+)['"]?\s*:\s*(major|minor|patch)\s*$/)
    if (!match) continue
    const [, name, bump] = match
    if (!result.has(name) || BUMP_RANK[bump] > BUMP_RANK[result.get(name)]) result.set(name, bump)
  }
  return result
}

function changesetBumps(files) {
  const result = new Map()
  for (const file of files.filter((candidate) => CHANGESET_RE.test(candidate))) {
    let text
    try {
      text = currentFile(file)
    } catch {
      continue
    }
    for (const [name, bump] of parseChangeset(text)) {
      if (!result.has(name) || BUMP_RANK[bump] > BUMP_RANK[result.get(name)]) result.set(name, bump)
    }
  }
  return result
}

function dereference(schema, document) {
  let result = schema
  const seen = new Set()
  while (isObject(result) && typeof result.$ref === 'string') {
    if (!result.$ref.startsWith('#/components/schemas/') || seen.has(result.$ref)) return result
    seen.add(result.$ref)
    result = document.components?.schemas?.[result.$ref.slice('#/components/schemas/'.length)]
    if (!result) return {}
  }
  return result
}

function addIssue(issues, message) {
  if (!issues.includes(message)) issues.push(message)
}

function compareSchema(before, after, beforeDocument, afterDocument, context, location, issues, seen = new Set()) {
  const key = `${context}:${before?.$ref ?? location}:${after?.$ref ?? location}`
  if (seen.has(key)) return
  seen.add(key)
  const left = dereference(before, beforeDocument)
  const right = dereference(after, afterDocument)
  if (!isObject(left) || !isObject(right)) return

  if (left.type && right.type && left.type !== right.type) addIssue(issues, `${location} changed type`)
  if (left.format && right.format && left.format !== right.format) addIssue(issues, `${location} changed format`)
  if (Array.isArray(left.enum) && Array.isArray(right.enum)) {
    for (const value of left.enum) {
      if (!right.enum.some((candidate) => JSON.stringify(candidate) === JSON.stringify(value))) addIssue(issues, `${location} removed enum value ${JSON.stringify(value)}`)
    }
  }
  if (left.items && right.items) compareSchema(left.items, right.items, beforeDocument, afterDocument, context, `${location}[]`, issues, seen)

  const leftProperties = isObject(left.properties) ? left.properties : {}
  const rightProperties = isObject(right.properties) ? right.properties : {}
  for (const property of Object.keys(leftProperties)) {
    if (!(property in rightProperties)) {
      addIssue(issues, `${location} removed property "${property}"`)
      continue
    }
    compareSchema(leftProperties[property], rightProperties[property], beforeDocument, afterDocument, context, `${location}.${property}`, issues, seen)
  }

  const beforeRequired = new Set(Array.isArray(left.required) ? left.required : [])
  const afterRequired = new Set(Array.isArray(right.required) ? right.required : [])
  if (context === 'request') {
    for (const property of afterRequired) {
      if (!beforeRequired.has(property)) addIssue(issues, `${location} added required property "${property}"`)
    }
    if (left.additionalProperties !== false && right.additionalProperties === false) addIssue(issues, `${location} now rejects additional properties`)
  }
  if (context === 'response') {
    for (const property of beforeRequired) {
      if (!afterRequired.has(property)) addIssue(issues, `${location} made property "${property}" optional`)
    }
  }
}

function schemaFromContent(content) {
  if (!isObject(content)) return null
  return Object.values(content).find((media) => isObject(media) && media.schema)?.schema ?? null
}

function parameterMap(pathItem, operation) {
  const parameters = [
    ...(Array.isArray(pathItem?.parameters) ? pathItem.parameters : []),
    ...(Array.isArray(operation?.parameters) ? operation.parameters : []),
  ]
  return new Map(parameters.map((parameter) => [parameter?.$ref ?? `${parameter?.in ?? ''}:${parameter?.name ?? ''}`, parameter]))
}

function compareOperation(before, after, beforePath, afterPath, beforeDocument, afterDocument, location, issues) {
  const previousParameters = parameterMap(beforePath, before)
  const currentParameters = parameterMap(afterPath, after)
  for (const [key, parameter] of previousParameters) {
    if (!currentParameters.has(key)) addIssue(issues, `${location} removed parameter "${parameter.name ?? key}"`)
  }
  for (const [key, parameter] of currentParameters) {
    const previous = previousParameters.get(key)
    if (parameter.required === true && previous?.required !== true) addIssue(issues, `${location} added required parameter "${parameter.name ?? key}"`)
    if (previous?.schema && parameter.schema) compareSchema(previous.schema, parameter.schema, beforeDocument, afterDocument, 'request', `${location} parameter ${key}`, issues)
  }

  const previousBody = before.requestBody
  const currentBody = after.requestBody
  if (previousBody && !currentBody) addIssue(issues, `${location} removed request body`)
  if (!previousBody && currentBody?.required === true) addIssue(issues, `${location} added a required request body`)
  if (previousBody && currentBody) {
    if (previousBody.required !== true && currentBody.required === true) addIssue(issues, `${location} made the request body required`)
    const previousContent = previousBody.content
    const currentContent = currentBody.content
    if (isObject(previousContent) && isObject(currentContent)) {
      for (const mediaType of Object.keys(previousContent)) {
        if (!(mediaType in currentContent)) addIssue(issues, `${location} removed request media type "${mediaType}"`)
      }
    }
    const previousSchema = schemaFromContent(previousContent)
    const currentSchema = schemaFromContent(currentContent)
    if (previousSchema && currentSchema) compareSchema(previousSchema, currentSchema, beforeDocument, afterDocument, 'request', `${location} request body`, issues)
  }

  const previousResponses = isObject(before.responses) ? before.responses : {}
  const currentResponses = isObject(after.responses) ? after.responses : {}
  for (const status of Object.keys(previousResponses)) {
    if (!(status in currentResponses)) {
      addIssue(issues, `${location} removed response ${status}`)
      continue
    }
    const previousContent = previousResponses[status]?.content
    const currentContent = currentResponses[status]?.content
    if (isObject(previousContent) && isObject(currentContent)) {
      for (const mediaType of Object.keys(previousContent)) {
        if (!(mediaType in currentContent)) addIssue(issues, `${location} removed response ${status} media type "${mediaType}"`)
      }
      const previousSchema = schemaFromContent(previousContent)
      const currentSchema = schemaFromContent(currentContent)
      if (previousSchema && currentSchema) compareSchema(previousSchema, currentSchema, beforeDocument, afterDocument, 'response', `${location} response ${status}`, issues)
    } else if (previousContent && !currentContent) {
      addIssue(issues, `${location} removed response ${status} content`)
    }
  }
}

export function findBreakingChanges(before, after) {
  const issues = []
  const previousPaths = isObject(before.paths) ? before.paths : {}
  const currentPaths = isObject(after.paths) ? after.paths : {}
  for (const pathName of Object.keys(previousPaths)) {
    if (!(pathName in currentPaths)) {
      addIssue(issues, `removed path "${pathName}"`)
      continue
    }
    for (const method of METHODS) {
      const previous = previousPaths[pathName]?.[method]
      const current = currentPaths[pathName]?.[method]
      if (previous && !current) addIssue(issues, `removed operation ${method.toUpperCase()} ${pathName}`)
      if (previous && current) compareOperation(previous, current, previousPaths[pathName], currentPaths[pathName], before, after, `${method.toUpperCase()} ${pathName}`, issues)
    }
  }
  return issues
}

function run(base) {
  const files = changedFiles(base)
  const contracts = [...new Set(files.map((file) => file.match(CONTRACT_RE)?.[1]).filter(Boolean))]
  if (!contracts.length) {
    console.log('no OpenAPI contract changes')
    return
  }

  const bumps = changesetBumps(files)
  const errors = []
  for (const name of contracts) {
    const file = `contracts/${name}/openapi.json`
    let before
    let after
    try {
      before = parseJson(execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8' }), `${base}:${file}`)
      after = parseJson(currentFile(file), file)
    } catch (error) {
      errors.push(`${file} has no readable baseline/current document: ${error.message}`)
      continue
    }
    const breaking = findBreakingChanges(before, after)
    for (const packageName of breaking.length ? [`${name}-service`, `@mts241alikhlash/api-${name}`] : []) {
      if (bumps.get(packageName) !== 'major') errors.push(`${file} is breaking (${breaking.join('; ')}); ${packageName} requires a major Changeset`)
    }
  }
  if (errors.length) throw new Error(errors.join('\n'))
  console.log(`contract compatibility valid: ${contracts.length} changed contract(s)`)
}

function selfCheck() {
  const before = {
    paths: {
      '/items': {
        post: {
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } },
          responses: { '200': { content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string' } } } } } } },
        },
      },
    },
  }
  const compatible = structuredClone(before)
  compatible.paths['/items'].get = { responses: { '200': {} } }
  assert.deepEqual(findBreakingChanges(before, compatible), [])

  const breaking = structuredClone(before)
  breaking.paths['/items'].post.requestBody.required = true
  breaking.paths['/items'].post.requestBody.content['application/json'].schema.required = ['name']
  delete breaking.paths['/items'].post.responses['200'].content['application/json'].schema.properties.status
  const issues = findBreakingChanges(before, breaking)
  assert.equal(issues.length, 3)
  assert.match(issues.join('\n'), /made the request body required/)
  assert.match(issues.join('\n'), /added required property "name"/)
  assert.match(issues.join('\n'), /removed property "status"/)

  const parsed = parseChangeset('---\ninventory-service: major\n"@mts241alikhlash/api-inventory": major\n---\n\nBreaking API change.')
  assert.equal(parsed.get('inventory-service'), 'major')
  assert.equal(parsed.get('@mts241alikhlash/api-inventory'), 'major')
  console.log('contract compatibility self-check passed')
}

if (process.argv.includes('--self-check')) {
  selfCheck()
} else {
  try {
    run(process.argv.slice(2).find((argument) => !argument.startsWith('--')))
  } catch (error) {
    console.error(`contract compatibility failed: ${error.message}`)
    process.exitCode = 1
  }
}
