import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PropertyService } from '../service/property/property.service';
import { ApiResponse } from '../utility/api-response';
import {
  SwaggerApiPaginatedResponseData,
  SwaggerApiResponseData,
} from '../common/decorator/swagger.decorator';
import { PropertyDto } from '../model/dto/property.dto';
import { Request } from 'express';
import { UserInfo } from '../common/guards/auth.guard';
import { CreatePropertyRequestDto } from '../model/request/create-property-request.dto';
import { UpdatePropertyRequestDto } from '../model/request/update-property-request.dto';
import { RequireRoles } from '../common/decorator/role.decorator';
import { UserRole } from '../model/enum/role.enum';
import {
  PaginationAndSortingResult,
  PaginationQueryDto,
} from '../utility/pagination-and-sorting';
import { CreateSubPropertyRequestDto } from '../model/request/create-subproperty-request.dto';
import { PropertyLookupResponseDto } from '../model/response/property-lookup-response.dto';
import {
  LocationQueryDto,
  NearbyQueryDto,
  ViewportQueryDto,
} from '../model/request/property-view-query.dto';
import { PropertySearchQueryDto } from '../model/request/property-search.dto';
import { VerdictDto } from '../model/request/verdict.dto';

@ApiTags('Property API')
@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) { }

  @ApiOperation({ summary: 'Api endpoint to create property' })
  @SwaggerApiResponseData({
    dataClass: PropertyDto,
    status: HttpStatus.CREATED,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() propertyRequest: CreatePropertyRequestDto,
    @Req() request: Request,
  ): Promise<ApiResponse<PropertyDto>> {
    const userInfo: UserInfo = request.user!;
    const response: PropertyDto = await this.propertyService.create(
      userInfo.userId,
      propertyRequest,
    );

    return ApiResponse.success(response, HttpStatus.CREATED);
  }

  @ApiOperation({
    summary: 'Api endpoint to create a sub-property for a verified property',
  })
  @SwaggerApiResponseData({
    dataClass: PropertyDto,
    status: HttpStatus.CREATED,
  })
  @Post('/:identifier/sub')
  @HttpCode(HttpStatus.CREATED)
  async createSubProperty(
    @Param('identifier') identifier: string,
    @Body() propertyRequest: CreateSubPropertyRequestDto,
    @Req() request: Request,
  ): Promise<ApiResponse<PropertyDto>> {
    const userInfo: UserInfo = request.user!;
    const response: PropertyDto = await this.propertyService.createSubProperty(
      identifier,
      userInfo.userId,
      propertyRequest,
    );

    return ApiResponse.success(response, HttpStatus.CREATED);
  }

  @ApiOperation({ summary: 'Submit property for verification' })
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
  })
  @Patch('/:identifier/submit')
  @HttpCode(HttpStatus.OK)
  async submitForVerification(
    @Param('identifier') identifier: string,
    @Req() request: Request,
  ): Promise<ApiResponse<string>> {
    const userInfo: UserInfo = request.user!;
    const response: string = await this.propertyService.submitForVerification(
      identifier,
      userInfo.userId,
    );

    return ApiResponse.success(response, HttpStatus.OK);
  }



  @ApiOperation({ summary: 'Api endpoint to update property' })
  @SwaggerApiResponseData({
    dataClass: PropertyDto,
    status: HttpStatus.OK,
  })
  @Patch('/:identifier')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('identifier') identifier: string,
    @Body() propertyRequest: UpdatePropertyRequestDto,
    @Req() request: Request,
  ): Promise<ApiResponse<PropertyDto>> {
    const userInfo: UserInfo = request.user!;
    const response: PropertyDto = await this.propertyService.update(
      identifier,
      userInfo.userId,
      propertyRequest,
    );

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({
    summary: 'Api endpoint to get properties for map based on viewport',
  })
  @SwaggerApiPaginatedResponseData({
    dataClass: PropertyLookupResponseDto,
    status: HttpStatus.OK,
  })
  @Get('/viewport')
  @HttpCode(HttpStatus.OK)
  async getPropertiesForViewport(
    @Query() propertyQuery: ViewportQueryDto,
    @Req() request: Request,
  ): Promise<
    ApiResponse<PaginationAndSortingResult<PropertyLookupResponseDto>>
  > {
    const userInfo: UserInfo = request.user!;
    const response: PaginationAndSortingResult<PropertyLookupResponseDto> =
      await this.propertyService.getPropertiesInViewport(
        userInfo.userId,
        propertyQuery,
      );

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({
    summary: 'Api endpoint to get properties for map based on location',
  })
  @SwaggerApiPaginatedResponseData({
    dataClass: PropertyLookupResponseDto,
    status: HttpStatus.OK,
  })
  @Get('location/:locationName')
  @HttpCode(HttpStatus.OK)
  async getPropertiesByLocation(
    @Param('locationName') locationName: string,
    @Query() propertyQuery: LocationQueryDto,
    @Req() request: Request,
  ): Promise<
    ApiResponse<PaginationAndSortingResult<PropertyLookupResponseDto>>
  > {
    const userInfo: UserInfo = request.user!;
    const response: PaginationAndSortingResult<PropertyLookupResponseDto> =
      await this.propertyService.getPropertiesByLocation(
        userInfo.userId,
        locationName,
        propertyQuery,
      );

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({
    summary: 'Api endpoint to get properties for map based on point',
  })
  @SwaggerApiPaginatedResponseData({
    dataClass: PropertyLookupResponseDto,
    status: HttpStatus.OK,
  })
  @Get('/point')
  @HttpCode(HttpStatus.OK)
  async getNearbyProperties(
    @Query() propertyQuery: NearbyQueryDto,
    @Req() request: Request,
  ): Promise<
    ApiResponse<PaginationAndSortingResult<PropertyLookupResponseDto>>
  > {
    const userInfo: UserInfo = request.user!;
    const response: PaginationAndSortingResult<PropertyLookupResponseDto> =
      await this.propertyService.getNearbyProperties(
        userInfo.userId,
        propertyQuery,
      );

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({ summary: 'Api endpoint to get company properties' })
  @SwaggerApiPaginatedResponseData({
    dataClass: PropertyDto,
    status: HttpStatus.OK,
  })
  @Get('/company/:companyId')
  @HttpCode(HttpStatus.OK)
  async getCompanyProperties(
    @Param('companyId') companyId: string,
    @Query() propertyQuery: PaginationQueryDto,
    @Req() request: Request,
  ): Promise<ApiResponse<PaginationAndSortingResult<PropertyDto>>> {
    const userInfo: UserInfo = request.user!;
    const response: PaginationAndSortingResult<PropertyDto> =
      await this.propertyService.getAllCompanyProperties(
        userInfo.userId,
        companyId,
        propertyQuery,
      );

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({ summary: 'Api endpoint to get property details' })
  @SwaggerApiResponseData({
    dataClass: PropertyDto,
    status: HttpStatus.OK,
  })
  @Get('/:identifier')
  @HttpCode(HttpStatus.OK)
  async getOne(
    @Param('identifier') identifier: string,
    @Req() request: Request,
  ): Promise<ApiResponse<PropertyDto>> {
    const userInfo: UserInfo = request.user!;
    const response: PropertyDto = await this.propertyService.getOne(
      identifier,
      userInfo.userId,
    );

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({
    summary: 'Api endpoint to get all sub-property for a property',
  })
  @SwaggerApiPaginatedResponseData({
    dataClass: PropertyDto,
    status: HttpStatus.OK,
  })
  @Get('/:identifier/sub')
  @HttpCode(HttpStatus.OK)
  async getAllSubPropertiesForProperty(
    @Param('identifier') identifier: string,
    @Query() propertyQuery: PaginationQueryDto,
    @Req() request: Request,
  ): Promise<ApiResponse<PaginationAndSortingResult<PropertyDto>>> {
    const userInfo: UserInfo = request.user!;
    const response: PaginationAndSortingResult<PropertyDto> =
      await this.propertyService.getAllPropertySubProperty(
        identifier,
        userInfo.userId,
        propertyQuery,
      );

    return ApiResponse.success(response, HttpStatus.OK);
  }
}
