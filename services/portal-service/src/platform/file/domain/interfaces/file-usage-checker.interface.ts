export interface FileUsageReference {
  label: string
  isPublic: boolean
}

export abstract class IFileUsageChecker {
  abstract findReferences(fileId: string): Promise<FileUsageReference[]>
}
