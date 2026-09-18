import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { Controller, Get, Logger, Req, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiExcludeController } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { Public } from '../../../core/decorators/public.decorator.js'
import { PageMetaDto } from '../dto/response/page-meta.dto.js'
import { GetPageMetaUseCase } from '../use-cases/get-page-meta.use-case.js'
import { GetSitemapUseCase } from '../use-cases/get-sitemap.use-case.js'
import { injectMeta } from '../infrastructure/meta-tag.builder.js'
import {
  buildRobotsTxt,
  buildSitemapXml,
} from '../infrastructure/sitemap-xml.builder.js'

const API_PREFIXES = ['/portal/', '/api', '/auth', '/files', '/docs', '/health']

@ApiExcludeController()
@Controller()
export class PortalHtmlController {
  private readonly logger = new Logger(PortalHtmlController.name)

  private cachedHtml: string | null = null

  constructor(
    private readonly getPageMetaUseCase: GetPageMetaUseCase,
    private readonly getSitemapUseCase: GetSitemapUseCase,
    private readonly config: ConfigService,
  ) {}

  @Get('sitemap.xml')
  @Public()
  async sitemap(@Res() res: Response) {
    const entries = await this.getSitemapUseCase.execute()
    res.type('application/xml').send(buildSitemapXml(entries, this.baseUrl()))
  }

  @Get('robots.txt')
  @Public()
  robots(@Res() res: Response) {
    res.type('text/plain').send(buildRobotsTxt(this.baseUrl()))
  }

  @Get('*path')
  @Public()
  async serve(@Req() req: Request, @Res() res: Response) {
    const path = req.path

    if (API_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      res.status(404).json({ statusCode: 404, message: 'Not Found' })
      return
    }

    const html = await this.loadHtml()
    if (html === null) {
      res.status(404).send('Portal build not found')
      return
    }

    res.type('html').send(injectMeta(html, await this.resolveMeta(path)))
  }

  private async resolveMeta(path: string): Promise<PageMetaDto | null> {
    try {
      return await this.getPageMetaUseCase.execute(path)
    } catch (error) {
      if (!isNotFound(error)) {
        this.logger.warn(
          `Metadata lookup failed for ${path}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
      }
      return null
    }
  }

  private baseUrl(): string {
    return this.config.get<string>('PORTAL_BASE_URL') ?? 'http://localhost:5176'
  }

  private async loadHtml(): Promise<string | null> {
    if (this.cachedHtml !== null) return this.cachedHtml

    const root =
      this.config.get<string>('PORTAL_DIST_PATH') ??
      resolve(process.cwd(), 'public')

    try {
      const html = await readFile(join(root, 'index.html'), 'utf8')
      if (this.config.get<string>('NODE_ENV') === 'production') {
        this.cachedHtml = html
      }
      return html
    } catch {
      return null
    }
  }
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status: number }).status === 404
  )
}
