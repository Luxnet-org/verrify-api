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
import { CompanyService } from '../service/company/company.service';
import { RequireRoles } from '../common/decorator/role.decorator';
import { UserRole } from 'src/model/enum/role.enum';
import { CompanySearchQueryDto } from '../model/request/company-search-query.dto';
import { PaginationAndSortingResult } from '../utility/pagination-and-sorting';
import { CompanyDto } from '../model/dto/company.dto';
import { CompanyLookupResponse } from '../model/response/company-lookup-response.dto';
import { ApiResponse } from '../utility/api-response';
import {
  SwaggerApiPaginatedResponseData,
  SwaggerApiResponseData,
} from '../common/decorator/swagger.decorator';
import { Request } from 'express';
import { UserInfo } from '../common/guards/auth.guard';
import { CompanyProfileRequestDto } from '../model/request/create-company-profile.dto';
import { UpdateCompanyProfileDto } from '../model/request/update-company-profile.dto';
import { VerdictDto } from '../model/request/verdict.dto';

@ApiTags('Real Estate Company API')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) { }

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Retrieve all company profile with filter, pagination and sorting',
  })
  @SwaggerApiPaginatedResponseData({
    dataClass: CompanyLookupResponse,
    status: HttpStatus.OK,
  })
  @Get('get')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() searchDto: CompanySearchQueryDto,
  ): Promise<ApiResponse<PaginationAndSortingResult<CompanyLookupResponse>>> {
    const response: PaginationAndSortingResult<CompanyLookupResponse> =
      await this.companyService.findAll(searchDto);
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({ summary: 'Api endpoint for get user company profile' })
  @SwaggerApiResponseData({
    dataClass: CompanyDto,
    status: HttpStatus.OK,
  })
  @Get('/get/user')
  @HttpCode(HttpStatus.OK)
  async getUserCompanyProfile(
    @Req() request: Request,
  ): Promise<ApiResponse<CompanyDto>> {
    const userInfo: UserInfo = request.user!;
    const response: CompanyDto = await this.companyService.findUserCompany(
      userInfo.userId,
    );

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({ summary: 'Api endpoint to create company profile for user' })
  @SwaggerApiResponseData({
    dataClass: CompanyDto,
    status: HttpStatus.CREATED,
  })
  @Post('/create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() companyDto: CompanyProfileRequestDto,
    @Req() request: Request,
  ): Promise<ApiResponse<CompanyDto>> {
    const userInfo: UserInfo = request.user!;
    const response: CompanyDto = await this.companyService.create(
      userInfo.userId,
      companyDto,
    );

    return ApiResponse.success(response, HttpStatus.CREATED);
  }

  @ApiOperation({ summary: 'Api endpoint to update company profile for user' })
  @SwaggerApiResponseData({
    dataClass: CompanyDto,
    status: HttpStatus.OK,
  })
  @Patch('/update/:id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') companyId: string,
    @Body() companyDto: UpdateCompanyProfileDto,
    @Req() request: Request,
  ): Promise<ApiResponse<CompanyDto>> {
    const userInfo: UserInfo = request.user!;
    const response: CompanyDto = await this.companyService.update(
      companyId,
      userInfo.userId,
      companyDto,
    );

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({ summary: 'Submit company profile for verification' })
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
  })
  @Patch('/:id/submit')
  @HttpCode(HttpStatus.OK)
  async submitForVerification(
    @Param('id') companyId: string,
    @Req() request: Request,
  ): Promise<ApiResponse<string>> {
    const userInfo: UserInfo = request.user!;
    const response: string = await this.companyService.submitForVerification(
      companyId,
      userInfo.userId,
    );

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign company for review (admin only)' })
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
  })
  @Patch('/:id/assign-review')
  @HttpCode(HttpStatus.OK)
  async assignReview(
    @Param('id') companyId: string,
    @Req() request: Request,
  ): Promise<ApiResponse<string>> {
    const userInfo: UserInfo = request.user!;
    const response: string = await this.companyService.assignReview(
      companyId,
      userInfo.userId,
    );

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Give verdict on company (assigned reviewer only)' })
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
  })
  @Patch('/:id/verdict')
  @HttpCode(HttpStatus.OK)
  async giveVerdict(
    @Param('id') companyId: string,
    @Body() verdictDto: VerdictDto,
    @Req() request: Request,
  ): Promise<ApiResponse<string>> {
    const userInfo: UserInfo = request.user!;
    const response: string = await this.companyService.giveVerdict(
      companyId,
      userInfo.userId,
      verdictDto,
    );

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({
    summary: 'Api endpoint for retrieving a single company profile with the id',
  })
  @SwaggerApiResponseData({
    dataClass: CompanyDto,
    status: HttpStatus.OK,
  })
  @Get('/get/:id')
  async getOne(
    @Param('id') companyId: string,
    @Req() request: Request,
  ): Promise<ApiResponse<CompanyDto>> {
    const userInfo: UserInfo = request.user!;
    const response: CompanyDto = await this.companyService.findOne(
      companyId,
      userInfo.userId,
    );

    return ApiResponse.success(response, HttpStatus.OK);
  }
}
