import { Type } from 'class-transformer';
import {
  IsOptional,
  IsPositive,
  IsInt,
  Min,
  IsString,
  IsIn,
} from 'class-validator';
import { FindOptionsWhere, ILike } from 'typeorm';
import AppConstants from './app-constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationAndSortingResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export class PaginationMeta {
  @ApiProperty({ type: 'integer' })
  totalItems: number;

  @ApiProperty({ type: 'integer' })
  itemCount: number;

  @ApiProperty({ type: 'integer' })
  itemsPerPage: number;

  @ApiProperty({ type: 'integer' })
  totalPages: number;

  @ApiProperty({ type: 'integer' })
  currentPage: number;

  @ApiProperty({ type: 'boolean' })
  hasNextPage: boolean;

  @ApiProperty({ type: 'boolean' })
  hasPreviousPage: boolean;
}

export class PaginationQueryDto {
  @ApiPropertyOptional({
    type: 'string',
    default: '',
    description: 'This is the search query field',
  })
  @IsOptional()
  @IsString()
  search?: string = '';

  @ApiPropertyOptional({
    type: 'number',
    default: 1,
    description: 'This is the page number query field',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    type: 'integer',
    default: 10,
    description: 'This is the limit query field',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    type: 'string',
    default: 'createdAt',
    description: 'This is the sort query field',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    type: 'string',
    default: 'ASC',
    description: 'This is the order query field',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}

export class PaginationAndSorting {
  public static createFindOptions<T>(
    searchColumn: string | string[] | null,
    queryDto: PaginationQueryDto,
    additionalWhere: FindOptionsWhere<T> = {},
    compulsoryWhere: FindOptionsWhere<T> = {},
    relations: string[] = [],
  ) {
    const {
      page = AppConstants.PAGE,
      limit = AppConstants.PAGE_LIMIT,
      sortBy = AppConstants.PAGE_SORT,
      order = AppConstants.PAGE_ORDER,
      search = AppConstants.PAGE_SEARCH,
    }: PaginationQueryDto = queryDto;

    const validatedLimit: number = Math.min(limit, AppConstants.PAGE_LIMIT);

    const searchConditions = searchColumn
      ? Array.isArray(searchColumn)
        ? searchColumn.map((column) => ({
            ...compulsoryWhere,
            [column]: ILike(`%${search}%`),
          }))
        : [{ ...compulsoryWhere, [searchColumn]: ILike(`%${search}%`) }]
      : null;

    return {
      where:
        search || searchColumn
          ? [
              ...searchConditions!,
              ...(Object.keys(additionalWhere).length > 0
                ? [{ ...additionalWhere, ...compulsoryWhere }]
                : []),
            ]
          : [{ ...additionalWhere, ...compulsoryWhere }],
      skip: (page - 1) * limit,
      take: validatedLimit,
      order: { [sortBy]: order },
      relations,
    };
  }

  public static getPaginateResult<T, R>(
    data: T[],
    total: number,
    queryDto: PaginationQueryDto,
    convertToDto: (data: T) => R,
  ): PaginationAndSortingResult<R> {
    const { page = AppConstants.PAGE, limit = AppConstants.PAGE_LIMIT } =
      queryDto;
    const validatedLimit = Math.min(limit, AppConstants.PAGE_LIMIT);
    const totalPages = Math.ceil(total / validatedLimit);

    const newData = data.map((item) => convertToDto(item));

    return {
      data: newData,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: validatedLimit,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
