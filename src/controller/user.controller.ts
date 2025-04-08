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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '../service/user/user.service';
import { ApiResponse } from '../utility/api-response';
import { UserDto } from '../model/dto/user.dto';
import { UserInfo } from '../common/guards/auth.guard';
import { Request } from 'express';
import {
  SwaggerApiPaginatedResponseData,
  SwaggerApiResponseData,
} from '../common/decorator/swagger.decorator';
import { RequireRoles } from '../common/decorator/role.decorator';
import { UserRole } from '../model/enum/role.enum';
import {
  PaginationAndSortingResult,
  PaginationQueryDto,
} from '../utility/pagination-and-sorting';
import { UpdatePasswordRequestDto } from '../model/request/update-password-request.dto';
import { UpdateUserRequestDto } from '../model/request/update-user-request.dto';

@Controller('user')
@ApiTags('User API')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve all users with pagination and sorting' })
  @SwaggerApiPaginatedResponseData({
    dataClass: UserDto,
    status: HttpStatus.OK,
  })
  @Get('/get')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() findAllUsersDto: PaginationQueryDto,
  ): Promise<ApiResponse<PaginationAndSortingResult<UserDto>>> {
    const findUsers = await this.userService.findAll(findAllUsersDto);
    return ApiResponse.success(findUsers, HttpStatus.OK);
  }

  @ApiOperation({ summary: 'Api endpoint for getting current user' })
  @SwaggerApiResponseData({
    dataClass: UserDto,
    status: HttpStatus.OK,
    description: 'User profile retrieves the current user',
  })
  @Get('/current')
  @HttpCode(HttpStatus.OK)
  async currentUser(@Req() req: Request): Promise<ApiResponse<UserDto>> {
    const userInfo: UserInfo = req.user!;
    const response: UserDto = await this.userService.findSingleUser(
      userInfo.userId,
    );
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({ summary: 'Update user password' })
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
  })
  @Patch('/updatePassword')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Body() updatePasswordRequest: UpdatePasswordRequestDto,
    @Req() request: Request,
  ): Promise<ApiResponse<string>> {
    const userInfo: UserInfo = request.user!;
    const response = await this.userService.updatePassword(
      userInfo.userId,
      updatePasswordRequest,
    );
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({ summary: 'Update User Profile' })
  @SwaggerApiResponseData({
    dataClass: UserDto,
    status: HttpStatus.OK,
  })
  @Patch('/update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() request: Request,
    @Body() updateUserDto: UpdateUserRequestDto,
  ): Promise<ApiResponse<UserDto>> {
    const userInfo: UserInfo = request.user!;
    const updatedUser = await this.userService.updateUser(
      userInfo.userId,
      updateUserDto,
    );
    return ApiResponse.success(updatedUser, HttpStatus.OK);
  }

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Api endpoint for getting single user by Id' })
  @SwaggerApiResponseData({
    dataClass: UserDto,
    status: HttpStatus.OK,
    description: 'User profile retrieves the current user',
  })
  @Get('/get/:id')
  @HttpCode(HttpStatus.OK)
  async getSingleUser(
    @Param('id') userId: string,
  ): Promise<ApiResponse<UserDto>> {
    const response: UserDto = await this.userService.findSingleUser(userId);
    return ApiResponse.success(response, HttpStatus.OK);
  }
}
