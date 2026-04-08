import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class InitializePaymentRequestDto {
  @ApiProperty({ description: 'Verification package ID', example: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  packageId: string;
}
