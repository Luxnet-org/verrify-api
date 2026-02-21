import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireRoles } from '../common/decorator/role.decorator';
import { SwaggerApiResponseData, SwaggerApiPaginatedResponseData } from '../common/decorator/swagger.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { UserRole } from '../model/enum/role.enum';
import { ApiResponse } from '../utility/api-response';
import { AdminOverridePropertyDto } from '../model/request/admin-override-property.dto';
import { PropertyService } from '../service/property/property.service';
import { VerdictDto } from '../model/request/verdict.dto';
import { PropertyLookupResponseDto } from 'src/model/response/property-lookup-response.dto';
import { PropertySearchQueryDto } from 'src/model/request/property-search.dto';
import { PaginationAndSortingResult } from 'src/utility/pagination-and-sorting';

@ApiTags('Admin Property API')
@Controller('admin/property')
export class AdminPropertyController {
    constructor(
        private readonly propertyService: PropertyService,
    ) { }

    @ApiBearerAuth()
    @RequireRoles(UserRole.ADMIN)
    @Patch(':propertyId/override')
    @ApiOperation({ summary: 'Override property details (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async overrideProperty(
        @Param('propertyId') propertyId: string,
        @Body() payload: AdminOverridePropertyDto,
        @Req() request: Request,
    ): Promise<ApiResponse<any>> {
        const user: any = request.user!;
        const property = await this.propertyService.adminOverrideProperty(propertyId, user.userId, payload);
        return ApiResponse.success(property, HttpStatus.OK);
    }

    @ApiBearerAuth()

    @RequireRoles(UserRole.ADMIN)
    @Patch(':identifier/assign-review')
    @ApiOperation({ summary: 'Assign a property to an admin for review' })
    @SwaggerApiResponseData({ type: 'string', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async assignReview(
        @Param('identifier') identifier: string,
        @Req() request: Request,
    ): Promise<ApiResponse<string>> {
        const userInfo: any = request.user!;
        const response: string = await this.propertyService.assignReview(
            identifier,
            userInfo.userId,
        );

        return ApiResponse.success(response, HttpStatus.OK);
    }

    @ApiBearerAuth()
    @RequireRoles(UserRole.ADMIN)
    @Patch(':identifier/give-verdict')
    @ApiOperation({ summary: 'Give a verdict on a property review' })
    @SwaggerApiResponseData({ type: 'string', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async giveVerdict(
        @Param('identifier') identifier: string,
        @Body() verdictDto: VerdictDto,
        @Req() request: Request,
    ): Promise<ApiResponse<string>> {
        const userInfo: any = request.user!;
        const response: string = await this.propertyService.giveVerdict(
            identifier,
            userInfo.userId,
            verdictDto,
        );

        return ApiResponse.success(response, HttpStatus.OK);
    }

    @ApiBearerAuth()
    @RequireRoles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Api endpoint to get properties by admin',
    })
    @SwaggerApiPaginatedResponseData({
        dataClass: PropertyLookupResponseDto,
        status: HttpStatus.OK,
    })
    @Get('/get')
    async getAll(
        @Query() searchQuery: PropertySearchQueryDto,
    ): Promise<
        ApiResponse<PaginationAndSortingResult<PropertyLookupResponseDto>>
    > {
        const response: PaginationAndSortingResult<PropertyLookupResponseDto> =
            await this.propertyService.getAllProperties(searchQuery);

        return ApiResponse.success(response, HttpStatus.OK);
    }
}
