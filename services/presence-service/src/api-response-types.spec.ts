import { globSync, readFileSync } from 'node:fs'
import { join, sep } from 'node:path'

const UNTYPED_CEILING = 51

interface Handler {
  controller: string
  typed: boolean
}

const ROUTE_DECORATOR = /^\s*@(?:Get|Post|Patch|Put|Delete)\(/
const TYPED_SUCCESS = /@ApiResponse\(\s*\{[^)]*?status:\s*20[01][^)]*?type:/s

const NO_CONTENT =
  /@ApiResponse\(\s*\{[^)]*?status:\s*204|@HttpCode\(\s*(?:HttpStatus\.NO_CONTENT|204)\s*\)/s

export function handlersIn(source: string, controller: string): Handler[] {
  const chunks = source.split(/\n(?=\s*@(?:Get|Post|Patch|Put|Delete)\()/)

  return chunks
    .filter((chunk) => ROUTE_DECORATOR.test(chunk))
    .map((chunk) => {
      const block = chunk.split('async ')[0] ?? chunk
      return {
        controller,
        typed: TYPED_SUCCESS.test(block) || NO_CONTENT.test(block),
      }
    })
}

describe('endpoints document what they return', () => {
  const root = join(process.cwd(), 'src')
  const files = globSync('**/*.controller.ts', { cwd: root }).filter(
    (file) => !file.endsWith('.spec.ts'),
  )

  const handlers = files.flatMap((file) =>
    handlersIn(
      readFileSync(join(root, file), 'utf8'),
      file.split(sep).join('/'),
    ),
  )

  it('finds the controllers', () => {
    expect(files.length).toBeGreaterThan(5)
    expect(handlers.length).toBeGreaterThan(50)
  })

  it('never adds an endpoint that documents no response type', () => {
    const untyped = handlers.filter((handler) => !handler.typed)

    expect(untyped.length).toBeLessThanOrEqual(UNTYPED_CEILING)
  })

  describe('the matcher itself', () => {
    it('counts a handler whose success response names a type', () => {
      const typed = [
        `  @Post('recommend')`,
        `  @ApiResponse({ status: 200, description: 'x', type: RecommendationDto })`,
        `  async recommend() {}`,
      ].join('\n')

      expect(handlersIn(typed, 'x.controller.ts')).toEqual([
        { controller: 'x.controller.ts', typed: true },
      ])
    })

    it('counts one that only describes it', () => {
      const described = [
        `  @Get()`,
        `  @ApiResponse({ status: 200, description: 'List attendances' })`,
        `  async findAll() {}`,
      ].join('\n')

      expect(handlersIn(described, 'x.controller.ts')).toEqual([
        { controller: 'x.controller.ts', typed: false },
      ])
    })

    it('counts one with no @ApiResponse at all, which is most of them', () => {
      const bare = [
        `  @Get()`,
        `  @ApiOperation({ summary: 'List attendances' })`,
        `  async findAll() {}`,
      ].join('\n')

      expect(handlersIn(bare, 'x.controller.ts')).toEqual([
        { controller: 'x.controller.ts', typed: false },
      ])
    })

    it('asks nothing of a handler that answers 204', () => {
      const deleted = [
        `  @Delete(':id')`,
        `  @ApiResponse({ status: 204, description: 'Permission deleted' })`,
        `  async remove() {}`,
      ].join('\n')

      expect(handlersIn(deleted, 'x.controller.ts')).toEqual([
        { controller: 'x.controller.ts', typed: true },
      ])
    })

    it('accepts 204 declared through @HttpCode instead', () => {
      const deleted = [
        `  @Delete(':id')`,
        `  @HttpCode(HttpStatus.NO_CONTENT)`,
        `  async remove() {}`,
      ].join('\n')

      expect(handlersIn(deleted, 'x.controller.ts')).toEqual([
        { controller: 'x.controller.ts', typed: true },
      ])
    })

    it('does not let a handler borrow the type off the next one', () => {
      const two = [
        `  @Get()`,
        `  @ApiOperation({ summary: 'bare' })`,
        `  async findAll() {}`,
        ``,
        `  @Post()`,
        `  @ApiResponse({ status: 201, description: 'y', type: Thing })`,
        `  async create() {}`,
      ].join('\n')

      expect(handlersIn(two, 'x.controller.ts').map((h) => h.typed)).toEqual([
        false,
        true,
      ])
    })
  })
})
