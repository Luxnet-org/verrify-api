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
import { SwaggerApiResponseData } from '../common/decorator/swagger.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { PropertyVerification } from '../model/entity/property-verification.entity';
import { UserRole } from '../model/enum/role.enum';
import { VerificationStageStatus } from '../model/enum/verification-stage-status.enum';
import { AdminAdvanceStageDto } from '../model/request/admin-advance-stage.dto';
import { PropertyVerificationService } from '../service/property-verification/property-verification.service';
import { ApiResponse } from '../utility/api-response';
import { PropertyVerificationVerdictDto } from '../model/request/property-verification-verdict.dto';
import { PropertyVerificationDto } from '../model/dto/property-verification.dto';
import { PaginationAndSortingResult, PaginationQueryDto } from '../utility/pagination-and-sorting';
import { EmailEvent } from '../service/email/email-event.service';
import { EmailType } from '../model/enum/email-type.enum';

@ApiTags('Admin Verification API')
@Controller('admin/verification')
export class AdminVerificationController {
    constructor(
        private readonly propertyVerificationService: PropertyVerificationService,
        private readonly emailEvent: EmailEvent,
    ) { }

    @ApiBearerAuth()

    @RequireRoles(UserRole.ADMIN)
    @Get('list')
    @ApiOperation({ summary: 'List all verification requests (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async getAdminVerifications(
        @Query() queryDto: PaginationQueryDto,
        @Query('stage') stage?: VerificationStageStatus,
        @Query('propertyId') propertyId?: string,
        @Query('userId') userId?: string,
        @Query('search') search?: string,
    ): Promise<ApiResponse<PaginationAndSortingResult<PropertyVerificationDto>>> {
        const result = await this.propertyVerificationService.getAdminVerifications(queryDto, stage, propertyId, userId, search);
        return ApiResponse.success(result, HttpStatus.OK);
    }

    @ApiBearerAuth()
    @RequireRoles(UserRole.ADMIN)
    @Patch(':id/assign')
    @ApiOperation({ summary: 'Assign a verification request to yourself (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async assignReview(
        @Param('id') verificationId: string,
        @Req() request: Request,
    ): Promise<ApiResponse<PropertyVerificationDto>> {
        const user: any = request.user;
        const verification = await this.propertyVerificationService.assignReview(verificationId, user.userId);
        return ApiResponse.success(verification, HttpStatus.OK);
    }

    @ApiBearerAuth()
    @RequireRoles(UserRole.ADMIN)
    @Patch(':id/verdict')
    @ApiOperation({ summary: 'Assign verdict to a submitted verification request (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async assignVerdict(
        @Param('id') verificationId: string,
        @Req() request: Request,
        @Body() body: PropertyVerificationVerdictDto,
    ): Promise<ApiResponse<PropertyVerificationDto>> {
        const user: any = request.user;
        const verification = await this.propertyVerificationService.assignVerdict(verificationId, user.userId, body);
        return ApiResponse.success(verification, HttpStatus.OK);
    }

    @ApiBearerAuth()
    @RequireRoles(UserRole.ADMIN)
    @Patch(':id/advance-stage')
    @ApiOperation({ summary: 'Advance verification pipeline stage (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async advanceStage(
        @Param('id') verificationId: string,
        @Req() request: Request,
        @Body() payload: AdminAdvanceStageDto,
    ): Promise<ApiResponse<PropertyVerificationDto>> {
        const user: any = request.user;
        const verification = await this.propertyVerificationService.adminAdvanceStage(
            verificationId,
            user.userId,
            payload.verificationFiles,
            payload.adminComments
        );

        return ApiResponse.success(verification, HttpStatus.OK);
    }

}
