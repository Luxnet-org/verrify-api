import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponse<T> {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    type: 'string',
    example: 'SUCCESS! or ERROR!',
  })
  message: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional({
    description: 'Additional description or error details',
    oneOf: [{ type: 'string' }, { type: 'object' }],
    example: 'Additional information about the response',
  })
  description?: string | object;

  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.OK,
    type: Number,
  })
  status?: number;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    description?: string | object,
    status?: number,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.description = description;
    this.status = status;
  }

  public static empty<T>(): ApiResponse<T> {
    return new ApiResponse<T>(true, 'SUCCESS!');
  }

  public static success<T>(data: T, status: number): ApiResponse<T> {
    return new ApiResponse<T>(true, 'SUCCESS!', data, undefined, status);
  }

  public static error<T>(
    description: string | object,
    status: number,
  ): ApiResponse<T> {
    return new ApiResponse<T>(false, 'ERROR!', undefined, description, status);
  }
}
