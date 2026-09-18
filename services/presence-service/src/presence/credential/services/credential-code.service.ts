import { randomBytes } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { CREDENTIAL_CODE_BYTES } from '../constants/credential.constants.js'

@Injectable()
export class CredentialCodeService {
  generate(): string {
    return randomBytes(CREDENTIAL_CODE_BYTES).toString('base64url')
  }
}
