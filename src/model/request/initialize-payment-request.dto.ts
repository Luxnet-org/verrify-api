import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class InitializePaymentRequestDto {
  @ApiProperty({ description: 'Verification package ID', example: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  packageId: string;

  @ApiProperty({
    description: 'Client-generated key used to replay payment initialization',
    example: 'verification-payment-attempt-1',
  })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
