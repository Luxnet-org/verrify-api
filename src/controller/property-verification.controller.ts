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
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequireRoles } from '../common/decorator/role.decorator';
import { SwaggerApiResponseData } from '../common/decorator/swagger.decorator';
import { AuthGuard, UserInfo } from '../common/guards/auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { PropertyVerificationDto } from '../model/dto/property-verification.dto';
import { UserRole } from '../model/enum/role.enum';
import { UpdatePropertyVerificationDto } from '../model/request/update-property-verification.dto';
import { PropertyVerificationService } from '../service/property-verification/property-verification.service';
import { ApiResponse } from '../utility/api-response';
import { PaginationAndSortingResult, PaginationQueryDto } from '../utility/pagination-and-sorting';
import { InitiateVerificationDto } from '../model/request/initiate-verification.dto';

@ApiBearerAuth()
@ApiTags('Property Verification API')
@Controller('verification')

export class PropertyVerificationController {
    constructor(private readonly propertyVerificationService: PropertyVerificationService) { }

    @RequireRoles(UserRole.USER)
    @Post('initiate')
    @ApiOperation({ summary: 'Initiate a new property verification request' })
    @SwaggerApiResponseData({ dataClass: PropertyVerificationDto, status: HttpStatus.CREATED })
    @HttpCode(HttpStatus.CREATED)
    async initiateVerification(
        @Body() dto: InitiateVerificationDto,
        @Req() request: Request,
    ): Promise<ApiResponse<PropertyVerificationDto>> {
        const user: UserInfo = request.user!;
        const result = await this.propertyVerificationService.initiateVerification(dto, user.userId);
        return ApiResponse.success(result, HttpStatus.CREATED);
    }

    @RequireRoles(UserRole.USER)
    @Patch(':verificationId/update')
    @ApiOperation({ summary: 'Update an unsubmitted property verification request' })
    @SwaggerApiResponseData({ dataClass: PropertyVerificationDto, status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async updateVerification(
        @Param('verificationId') verificationId: string,
        @Body() dto: UpdatePropertyVerificationDto,
        @Req() request: Request,
    ): Promise<ApiResponse<PropertyVerificationDto>> {
        const user: UserInfo = request.user!;
        const result = await this.propertyVerificationService.updateVerification(verificationId, user.userId, dto);
        return ApiResponse.success(result, HttpStatus.OK);
    }

    @RequireRoles(UserRole.USER)
    @Patch(':verificationId/submit')
    @ApiOperation({ summary: 'Submit a property verification request for review' })
    @SwaggerApiResponseData({ dataClass: PropertyVerificationDto, status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async submitVerification(
        @Param('verificationId') verificationId: string,
        @Req() request: Request,
    ): Promise<ApiResponse<PropertyVerificationDto>> {
        const user: UserInfo = request.user!;
        const result = await this.propertyVerificationService.submitVerification(verificationId, user.userId);
        return ApiResponse.success(result, HttpStatus.OK);
    }

    @RequireRoles(UserRole.USER)
    @Get('my-requests')
    @ApiOperation({ summary: 'Get all verification requests for the current user' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async getMyVerifications(
        @Query() queryDto: PaginationQueryDto,
        @Req() request: Request,
    ): Promise<ApiResponse<PaginationAndSortingResult<PropertyVerificationDto>>> {
        const user: UserInfo = request.user!;
        const result = await this.propertyVerificationService.getMyVerifications(user.userId, queryDto);
        return ApiResponse.success(result, HttpStatus.OK);
    }

    @RequireRoles(UserRole.USER)
    @Get(':verificationId')
    @ApiOperation({ summary: 'Get a specific verification request' })
    @SwaggerApiResponseData({ dataClass: PropertyVerificationDto, status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async getVerification(
        @Param('verificationId') verificationId: string,
        @Req() request: Request,
    ): Promise<ApiResponse<PropertyVerificationDto>> {
        const user: UserInfo = request.user!;
        const result = await this.propertyVerificationService.getVerification(verificationId, user.userId);
        return ApiResponse.success(result, HttpStatus.OK);
    }
}
