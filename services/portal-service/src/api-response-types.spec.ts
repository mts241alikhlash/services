import { globSync, readFileSync } from 'node:fs'
import { join, sep } from 'node:path'

const UNTYPED_CEILING = 46

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
    expect(files.length).toBeGreaterThan(12)
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

const SIGNATURE =
  /^ {2}(?:async )?(\w+)\([\s\S]*?\)(?:\s*:\s*([^{]+?))?\s*\{\n/m
const DOCUMENTED_TYPE =
  /@ApiResponse\(\{[^@]*?status:\s*20[01][^@]*?type:\s*(?:\(\)\s*=>\s*)?\[?\s*(\w+)/g
const SUCCESS_RESPONSE = /@ApiResponse\(\{[^@]*?status:\s*20[01][^@]*?\}\)/g
const DTO_RETURN =
  /^(?:Promise<\s*(?:\w+Dto(?:\[\])?(?:\s*\|\s*(?:null|undefined))?|void|StreamableFile|HealthCheckResult)\s*>|\w+Dto(?:\[\])?|void)$/

export function handlersWithoutDto(source: string): string[] {
  return source
    .split(/\n(?=\s*@(?:Get|Post|Patch|Put|Delete)\()/)
    .filter((chunk) => /^\s*@(?:Get|Post|Patch|Put|Delete)\(/.test(chunk))
    .map((chunk) => SIGNATURE.exec(chunk))
    .filter((match): match is RegExpExecArray => match !== null)
    .flatMap((match) => {
      const returned = (match[2] ?? '').trim()
      if (!DTO_RETURN.test(returned)) return [match[1]]
      const dto = /^(?:Promise<\s*)?(\w+)/.exec(returned)?.[1] ?? ''
      if (!dto.endsWith('Dto')) return []
      const decorators = match.input.slice(0, match.index)
      const documented = [...decorators.matchAll(DOCUMENTED_TYPE)].map(
        (doc) => doc[1],
      )
      const successes = decorators.match(SUCCESS_RESPONSE) ?? []
      if (successes.some((block) => !block.includes('type:')))
        return [`${match[1]} documents a success with no type`]
      return documented.some((name) => name !== dto)
        ? [`${match[1]} documents ${documented.join(', ')}`]
        : []
    })
}

describe('handlers return the DTO they document', () => {
  it('types every handler with a response DTO, void, a file or a health check', () => {
    const root = join(process.cwd(), 'src')
    const untyped = globSync('**/*.controller.ts', { cwd: root })
      .filter((file) => !file.endsWith('.spec.ts'))
      .flatMap((file) =>
        handlersWithoutDto(readFileSync(join(root, file), 'utf8')).map(
          (handler) => `${file.split(sep).join('/')} ${handler}`,
        ),
      )

    expect(untyped).toEqual([])
  })

  it('rejects a handler that returns a domain type', () => {
    const source = [
      `  @Get(':id')`,
      `  async findOne(id: string): Promise<EmployeeWithDetails> {`,
      `    return this.useCase.execute(id)`,
      `  }`,
      ``,
      `  @Delete(':id')`,
      `  async remove(id: string): Promise<void> {`,
      `    await this.useCase.execute(id)`,
      `  }`,
      ``,
      `  @Get()`,
      `  async findAll(`,
      `    @Query() query: QueryDto,`,
      `  ): Promise<EmployeeListResponseDto> {`,
      `    return EmployeeListResponseDto.fromDomain(await x)`,
      `  }`,
      ``,
      `  @Get('stale')`,
      `  @ApiResponse({ status: 200, type: OldDto })`,
      `  async stale(): Promise<NewDto> {`,
      `    return NewDto.fromDomain(await x)`,
      `  }`,
      ``,
      `  @Get('undocumented')`,
      `  @ApiResponse({ status: 200, description: 'x' })`,
      `  async undocumented(): Promise<NewDto> {`,
      `    return NewDto.fromDomain(await x)`,
      `  }`,
      ``,
      `  @Get('bare')`,
      `  bare() {`,
      `    return 1`,
      `  }`,
    ].join('\n')

    expect(handlersWithoutDto(source)).toEqual([
      'findOne',
      'stale documents OldDto',
      'undocumented documents a success with no type',
      'bare',
    ])
  })
})
