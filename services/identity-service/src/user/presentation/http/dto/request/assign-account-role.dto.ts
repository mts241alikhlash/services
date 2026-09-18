import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class AssignAccountRoleDto {
  @ApiProperty({ example: 'STUDENT' })
  @IsString()
  @IsNotEmpty()
  roleCode: string
}
