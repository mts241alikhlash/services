import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  IAdmissionDocumentTypeRepository,
  type CreateDocumentTypeInput,
  type UpdateDocumentTypeInput,
} from '../../../domain/repositories/admission-document-type-repository.js'
import { documentTypeCode } from '../../../domain/policies/document-type-code.policy.js'

@Injectable()
export class SaveDocumentTypeUseCase {
  constructor(private readonly repository: IAdmissionDocumentTypeRepository) {}

  async create(input: CreateDocumentTypeInput) {
    const name = this.requireName(input.name)
    await this.assertNameFree(name)
    const [codes, maxSortOrder] = await Promise.all([
      this.repository.findAllCodes(),
      this.repository.maxSortOrder(),
    ])
    return this.repository.create({
      ...input,
      name,
      code: documentTypeCode(name, new Set(codes)),
      sortOrder: maxSortOrder + 1,
    })
  }

  async update(id: string, input: UpdateDocumentTypeInput) {
    if (!(await this.repository.findById(id))) {
      throw new NotFoundException('Jenis berkas tidak ditemukan')
    }
    const name =
      input.name === undefined ? undefined : this.requireName(input.name)
    if (name !== undefined) await this.assertNameFree(name, id)
    return this.repository.update(id, {
      ...input,
      ...(name !== undefined && { name }),
    })
  }

  private requireName(raw: string) {
    const name = raw.trim()
    if (!name) throw new BadRequestException('Nama jenis berkas wajib diisi')
    return name
  }

  private async assertNameFree(name: string, exceptId?: string) {
    if (await this.repository.nameTaken(name, exceptId)) {
      throw new ConflictException('Nama jenis berkas sudah ada')
    }
  }
}
