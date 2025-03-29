import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse as SwaggerApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Type } from '@nestjs/common';
import { ApiResponse } from 'src/utility/api-response';
import {
  PaginationAndSortingResult,
  PaginationMeta,
} from 'src/utility/pagination-and-sorting';

export const SwaggerApiResponseData = <T extends Type<unknown>>({
  status,
  dataClass,
  description,
  type,
}: {
  status: number;
  dataClass?: T;
  description?: string;
  type?:
    | 'array'
    | 'string'
    | 'number'
    | 'boolean'
    | 'integer'
    | 'null'
    | 'object';
}) => {
  const extraModels = dataClass ? [ApiResponse, dataClass] : [ApiResponse];

  return applyDecorators(
    ApiExtraModels(...extraModels),

    SwaggerApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponse) },
          {
            properties: dataClass
              ? {
                  data: { $ref: getSchemaPath(dataClass) },
                }
              : {
                  data: { type: type },
                },
          },
        ],
      },
    }),
  );
};

export const SwaggerApiPaginatedResponseData = <T extends Type<any>>({
  status,
  dataClass,
  description,
  type,
}: {
  status: number;
  dataClass?: T;
  description?: string;
  type?:
    | 'array'
    | 'string'
    | 'number'
    | 'boolean'
    | 'integer'
    | 'null'
    | 'object';
}) => {
  const extraModels = dataClass
    ? [ApiResponse, PaginationAndSortingResult, PaginationMeta, dataClass]
    : [ApiResponse, PaginationAndSortingResult, PaginationMeta];

  return applyDecorators(
    ApiExtraModels(...extraModels),

    SwaggerApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponse) },
          {
            properties: {
              data: {
                allOf: [
                  { $ref: getSchemaPath(PaginationAndSortingResult) },
                  {
                    properties: dataClass
                      ? {
                          data: {
                            type: 'array',
                            items: { $ref: getSchemaPath(dataClass) },
                          },
                          meta: {
                            $ref: getSchemaPath(PaginationMeta),
                          },
                        }
                      : {
                          data: {
                            type: 'array',
                            items: { type },
                          },
                          meta: {
                            $ref: getSchemaPath(PaginationMeta),
                          },
                        },
                  },
                ],
              },
            },
          },
        ],
      },
    }),
  );
};
