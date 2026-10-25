import { Readable } from 'node:stream'
import type { ExamFile } from '../domain/entities/exam-file.entity.js'
import {
  IExamFileRepository,
  type NewExamFile,
} from '../domain/repositories/exam-file.repository.js'
import { IExamFileStorage } from '../domain/repositories/exam-file-storage.js'

export class FakeExamFileRepository extends IExamFileRepository {
  readonly files = new Map<string, ExamFile>()

  create(input: NewExamFile) {
    const file = { ...input, createdAt: new Date() }
    this.files.set(file.id, file)
    return Promise.resolve(file)
  }

  findById(id: string) {
    return Promise.resolve(this.files.get(id) ?? null)
  }
}

export class FakeExamFileStorage extends IExamFileStorage {
  readonly objects = new Map<string, { content: Buffer; mimeType: string }>()

  put(fileId: string, content: Buffer, mimeType: string) {
    const key = `exam/questions/${fileId}`
    this.objects.set(key, { content, mimeType })
    return Promise.resolve(key)
  }

  read(storageKey: string) {
    const object = this.objects.get(storageKey)
    if (!object) return Promise.reject(new Error(`no object ${storageKey}`))
    return Promise.resolve({ stream: Readable.from(object.content) })
  }
}
