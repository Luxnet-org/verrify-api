import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, UserInfo } from '../common/guards/auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { RequireRoles } from '../common/decorator/role.decorator';
import { UserRole } from '../model/enum/role.enum';
import { PortfolioService } from '../service/portfolio/portfolio.service';
import { Request } from 'express';
import { PropertyDto } from '../model/dto/property.dto';
import { ApiResponse } from '../utility/api-response';
import { SwaggerApiResponseData } from '../common/decorator/swagger.decorator';
import {
    PaginationAndSortingResult,
    PaginationQueryDto,
} from '../utility/pagination-and-sorting';

@ApiBearerAuth()
@ApiTags('Portfolio')
@Controller('portfolio')

export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) { }

    @RequireRoles(UserRole.USER)
    @Get('lookup/:pin')
    @ApiOperation({ summary: 'Look up a property by PIN code' })
    @SwaggerApiResponseData({ dataClass: PropertyDto, status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async lookupProperty(
        @Param('pin') pin: string,
        @Req() request: Request,
    ): Promise<ApiResponse<PropertyDto>> {
        const user: UserInfo = request.user!;
        const result = await this.portfolioService.lookupProperty(pin, user.userId);
        return ApiResponse.success(result, HttpStatus.OK);
    }

    @RequireRoles(UserRole.USER)
    @Post('claim/:pin')
    @ApiOperation({ summary: 'Claim a property using its PIN code' })
    @SwaggerApiResponseData({ type: 'string', status: HttpStatus.CREATED })
    @HttpCode(HttpStatus.CREATED)
    async claimProperty(
        @Param('pin') pin: string,
        @Req() request: Request,
    ): Promise<ApiResponse<string>> {
        const user: UserInfo = request.user!;
        const result = await this.portfolioService.claimProperty(pin, user.userId);
        return ApiResponse.success(result, HttpStatus.CREATED);
    }

    @RequireRoles(UserRole.USER)
    @Get('my-properties')
    @ApiOperation({ summary: 'Get all claimed properties in user portfolio (paginated)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async getMyProperties(
        @Query() queryDto: PaginationQueryDto,
        @Req() request: Request,
    ): Promise<ApiResponse<PaginationAndSortingResult<any>>> {
        const user: UserInfo = request.user!;
        const result = await this.portfolioService.getMyProperties(user.userId, queryDto);
        return ApiResponse.success(result, HttpStatus.OK);
    }
}
