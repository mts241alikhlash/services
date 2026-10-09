import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { IAdmissionDownloadRepository } from '../../../domain/repositories/admission-download-repository.js'
import { IAdmissionDownloadStorage } from '../../../domain/repositories/admission-download-storage.port.js'
import {
  toStoredPdf,
  type PdfUpload,
} from '../../../domain/policies/pdf-upload.policy.js'

export interface CreateDownloadInput {
  title: string
  description?: string | null
  isActive?: boolean
  file: PdfUpload | undefined
}

export interface UpdateDownloadInput {
  title?: string
  description?: string | null
  isActive?: boolean
  file?: PdfUpload
}

const storageKey = () => `admission-downloads/${randomUUID()}.pdf`

function cleanDescription(value: string | null | undefined) {
  const text = value?.trim()
  return text ? text : null
}

@Injectable()
export class SaveDownloadUseCase {
  private readonly logger = new Logger(SaveDownloadUseCase.name)

  constructor(
    private readonly repository: IAdmissionDownloadRepository,
    private readonly storage: IAdmissionDownloadStorage,
  ) {}

  async create(input: CreateDownloadInput) {
    const title = this.requireTitle(input.title)
    await this.assertTitleFree(title)
    const pdf = toStoredPdf(input.file)
    const fileKey = storageKey()
    const sortOrder = (await this.repository.maxSortOrder()) + 1
    await this.storage.put(fileKey, pdf.content)
    try {
      return await this.repository.create({
        title,
        description: cleanDescription(input.description),
        fileKey,
        fileName: pdf.fileName,
        sizeBytes: pdf.sizeBytes,
        sortOrder,
        isActive: input.isActive ?? true,
      })
    } catch (error) {
      await this.discard(fileKey)
      throw error
    }
  }

  async update(id: string, input: UpdateDownloadInput) {
    const current = await this.repository.findById(id)
    if (!current) throw new NotFoundException('Berkas tidak ditemukan')
    const title =
      input.title === undefined ? undefined : this.requireTitle(input.title)
    if (title !== undefined) await this.assertTitleFree(title, id)
    const pdf = input.file ? toStoredPdf(input.file) : null
    const fileKey = pdf ? storageKey() : null
    if (pdf && fileKey) await this.storage.put(fileKey, pdf.content)
    try {
      const updated = await this.repository.update(id, {
        ...(title !== undefined && { title }),
        ...(input.description !== undefined && {
          description: cleanDescription(input.description),
        }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(pdf &&
          fileKey && {
            fileKey,
            fileName: pdf.fileName,
            sizeBytes: pdf.sizeBytes,
          }),
      })
      if (pdf) await this.discard(current.fileKey)
      return updated
    } catch (error) {
      if (fileKey) await this.discard(fileKey)
      throw error
    }
  }

  private requireTitle(raw: string) {
    const title = raw.trim()
    if (!title) throw new BadRequestException('Judul berkas wajib diisi')
    return title
  }

  private async assertTitleFree(title: string, exceptId?: string) {
    if (await this.repository.titleTaken(title, exceptId)) {
      throw new ConflictException('Judul berkas sudah ada')
    }
  }

  private async discard(fileKey: string) {
    try {
      await this.storage.remove(fileKey)
    } catch (error) {
      this.logger.warn(
        `Could not remove ${fileKey}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}
