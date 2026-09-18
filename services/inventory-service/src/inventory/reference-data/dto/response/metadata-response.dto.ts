import { ApiProperty } from '@nestjs/swagger'
import { InventoryCategoryResponseDto } from '../../category/presentation/http/dto/response/category-response.dto.js'
import { InventoryConditionResponseDto } from '../../condition/presentation/http/dto/response/condition-response.dto.js'
import { InventoryFundingSourceResponseDto } from '../../funding-source/presentation/http/dto/response/funding-source-response.dto.js'
import { InventoryLocationResponseDto } from '../../location/presentation/http/dto/response/location-response.dto.js'
import { InventoryStatusResponseDto } from '../../status/presentation/http/dto/response/status-response.dto.js'

export class InventoryMetadataResponseDto {
  @ApiProperty({ type: () => [InventoryCategoryResponseDto] })
  categories!: InventoryCategoryResponseDto[]

  @ApiProperty({ type: () => [InventoryLocationResponseDto] })
  locations!: InventoryLocationResponseDto[]

  @ApiProperty({ type: () => [InventoryConditionResponseDto] })
  conditions!: InventoryConditionResponseDto[]

  @ApiProperty({ type: () => [InventoryStatusResponseDto] })
  statuses!: InventoryStatusResponseDto[]

  @ApiProperty({ type: () => [InventoryFundingSourceResponseDto] })
  fundingSources!: InventoryFundingSourceResponseDto[]
}
