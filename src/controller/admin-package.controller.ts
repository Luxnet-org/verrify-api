import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireRoles } from '../common/decorator/role.decorator';
import { Public } from '../common/decorator/public.decorator';
import { SwaggerApiResponseData } from '../common/decorator/swagger.decorator';
import { UserRole } from '../model/enum/role.enum';
import { VerificationPackage } from '../model/entity/verification-package.entity';
import { CreateVerificationPackageDto } from '../model/request/create-verification-package.dto';
import { UpdateVerificationPackageDto } from '../model/request/update-verification-package.dto';
import { VerificationPackageService } from '../service/verification-package/verification-package.service';
import { ApiResponse } from '../utility/api-response';

@ApiTags('Verification Package API')
@Controller('verification-packages')
export class AdminPackageController {
    constructor(
        private readonly verificationPackageService: VerificationPackageService,
    ) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get all active verification packages (Public)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async getActivePackages(): Promise<ApiResponse<VerificationPackage[]>> {
        const packages = await this.verificationPackageService.findAllActive();
        return ApiResponse.success(packages, HttpStatus.OK);
    }

    @ApiBearerAuth()
    @RequireRoles(UserRole.ADMIN)
    @Get('admin')
    @ApiOperation({ summary: 'Get all verification packages including inactive (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async getAllPackages(): Promise<ApiResponse<VerificationPackage[]>> {
        const packages = await this.verificationPackageService.findAll();
        return ApiResponse.success(packages, HttpStatus.OK);
    }

    @ApiBearerAuth()
    @RequireRoles(UserRole.ADMIN)
    @Get('admin/:id')
    @ApiOperation({ summary: 'Get a verification package by ID (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async getPackageById(
        @Param('id') id: string,
    ): Promise<ApiResponse<VerificationPackage>> {
        const pkg = await this.verificationPackageService.findById(id);
        return ApiResponse.success(pkg, HttpStatus.OK);
    }

    @ApiBearerAuth()
    @RequireRoles(UserRole.ADMIN)
    @Post('admin')
    @ApiOperation({ summary: 'Create a new verification package (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.CREATED })
    @HttpCode(HttpStatus.CREATED)
    async createPackage(
        @Body() dto: CreateVerificationPackageDto,
    ): Promise<ApiResponse<VerificationPackage>> {
        const pkg = await this.verificationPackageService.create(dto);
        return ApiResponse.success(pkg, HttpStatus.CREATED);
    }

    @ApiBearerAuth()
    @RequireRoles(UserRole.ADMIN)
    @Patch('admin/:id')
    @ApiOperation({ summary: 'Update a verification package (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async updatePackage(
        @Param('id') id: string,
        @Body() dto: UpdateVerificationPackageDto,
    ): Promise<ApiResponse<VerificationPackage>> {
        const pkg = await this.verificationPackageService.update(id, dto);
        return ApiResponse.success(pkg, HttpStatus.OK);
    }

    @ApiBearerAuth()
    @RequireRoles(UserRole.ADMIN)
    @Delete('admin/:id')
    @ApiOperation({ summary: 'Delete a verification package (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async deletePackage(
        @Param('id') id: string,
    ): Promise<ApiResponse<void>> {
        await this.verificationPackageService.remove(id);
        return ApiResponse.empty();
    }
}
