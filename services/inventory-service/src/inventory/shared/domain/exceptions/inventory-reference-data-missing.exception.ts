import { InternalServerErrorException } from '@nestjs/common'

export class InventoryReferenceDataMissingException extends InternalServerErrorException {
  constructor(missing: string[]) {
    super(
      `The inventory loan flow cannot run because reference data is missing: ${missing.join(
        ', ',
      )}. Asset status roles are assigned under Referensi > Status Aset; transaction types ship with the database migration.`,
    )
  }
}
