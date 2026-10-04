import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly client: S3Client | null
  private readonly signer: S3Client | null
  private readonly bucket: string | undefined
  private readonly signedUrlExpirySeconds: number

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET')
    this.signedUrlExpirySeconds =
      this.configService.get<number>('S3_SIGNED_URL_EXPIRY_SECONDS') ?? 3600

    const endpoint = this.configService.get<string>('S3_ENDPOINT')
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID')
    const secretAccessKey = this.configService.get<string>(
      'S3_SECRET_ACCESS_KEY',
    )

    if (!endpoint || !this.bucket || !accessKeyId || !secretAccessKey) {
      this.client = null
      this.signer = null
      this.logger.warn(
        'S3 is not configured; avatar upload is unavailable. Everything else ' +
          'in this service works without it.',
      )
      return
    }

    const publicEndpoint =
      this.configService.get<string>('S3_PUBLIC_ENDPOINT') ?? endpoint
    const region = this.configService.get<string>('S3_REGION')
    const credentials = { accessKeyId, secretAccessKey }

    this.client = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials,
    })

    this.signer =
      publicEndpoint === endpoint
        ? this.client
        : new S3Client({
            endpoint: publicEndpoint,
            region,
            forcePathStyle: true,
            credentials,
          })
  }

  get isConfigured(): boolean {
    return this.client !== null
  }

  private require(): { client: S3Client; signer: S3Client; bucket: string } {
    if (!this.client || !this.signer || !this.bucket) {
      throw new ServiceUnavailableException(
        'Object storage is not configured for this service.',
      )
    }
    return { client: this.client, signer: this.signer, bucket: this.bucket }
  }

  async uploadFile(
    fileBuffer: Buffer,
    filePath: string,
    mimeType: string,
  ): Promise<string> {
    const { client, bucket } = this.require()
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: filePath,
          Body: fileBuffer,
          ContentType: mimeType,
        }),
      )
    } catch (err) {
      this.logger.error(
        `Failed to upload file to ${filePath}`,
        err instanceof Error ? err.stack : undefined,
      )
      throw new InternalServerErrorException(
        `Failed to upload file: ${String(err)}`,
      )
    }

    this.logger.log(`Uploaded file successfully: ${filePath}`)
    return filePath
  }

  async deleteFile(filePath: string): Promise<void> {
    const { client, bucket } = this.require()
    try {
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: filePath }),
      )
    } catch (err) {
      this.logger.error(
        `Failed to delete file from ${filePath}`,
        err instanceof Error ? err.stack : undefined,
      )
      throw new InternalServerErrorException(
        `Failed to delete file: ${String(err)}`,
      )
    }

    this.logger.log(`Deleted file successfully: ${filePath}`)
  }

  async getSignedUrl(filePath: string): Promise<string | null> {
    if (!this.client) return null
    const { signer, bucket } = this.require()
    return getSignedUrl(
      signer,
      new GetObjectCommand({ Bucket: bucket, Key: filePath }),
      { expiresIn: this.signedUrlExpirySeconds },
    )
  }
}
