import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Post,
} from '@nestjs/common';
import { AuthService } from 'src/service/auth/auth.service';
import { RegisterRequestDto } from 'src/model/request/register-request.dto';
import { ApiResponse } from '../utility/api-response';
import { SwaggerApiResponseData } from '../common/decorator/swagger.decorator';
import { AuthResponseDto } from '../model/response/auth-response.dto';
import { VerifyRegistrationDto } from '../model/request/verify-registration.dto';
import { Request } from 'express';
import { AuthRequestDto } from '../model/request/auth-request.dto';
import { LogoutRequestDto } from '../model/request/logout-request.dto';
import { RefreshTokenRequestDto } from '../model/request/refresh-token-request.dto';
import { ResetPasswordRequestDto } from 'src/model/request/reset-password-request.dto';
import { Public } from '../common/decorator/public.decorator';
import { VerifyForgotPasswordRequestDto } from '../model/request/verify-forgot-password-request.dto';
import { ForgotPasswordRequestDto } from '../model/request/forgot-password-request.dto';

@ApiTags('Authentication API')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Api endpoint for user registration' })
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.CREATED,
    description: 'Confirm your account in the email sent',
  })
  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(
    @Body() registerRequestDto: RegisterRequestDto,
  ): Promise<ApiResponse<string>> {
    const response: string =
      await this.authService.registerUser(registerRequestDto);
    return ApiResponse.success(response, HttpStatus.CREATED);
  }

  @Public()
  @ApiOperation({ summary: 'Api endpoint for registration confirmation' })
  @SwaggerApiResponseData({
    dataClass: AuthResponseDto,
    status: HttpStatus.OK,
    description: 'Confirm your account in the email sent',
  })
  @Post('/verify/register')
  @HttpCode(HttpStatus.OK)
  async verifyRegistration(
    @Body() verifyRegistrationDto: VerifyRegistrationDto,
    @Req() request: Request,
  ): Promise<ApiResponse<AuthResponseDto>> {
    const response: AuthResponseDto = await this.authService.verifyRegistration(
      verifyRegistrationDto,
      request,
    );
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @Public()
  @ApiOperation({ summary: 'Api endpoint for user registration confirmation' })
  @SwaggerApiResponseData({
    dataClass: AuthResponseDto,
    status: HttpStatus.OK,
    description: 'Account verification successful',
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() authRequestDto: AuthRequestDto,
    @Req() request: Request,
  ): Promise<ApiResponse<AuthResponseDto>> {
    const response: AuthResponseDto = await this.authService.login(
      authRequestDto,
      request,
    );
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @ApiOperation({ summary: 'Api endpoint for user logout' })
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
    description: 'Account logout successful',
  })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() logoutRequestDto: LogoutRequestDto,
    @Req() request: Request,
  ): Promise<ApiResponse<string>> {
    const response: string = await this.authService.logout(
      logoutRequestDto,
      request,
    );
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @Public()
  @ApiOperation({ summary: 'Api endpoint for user token refresh' })
  @SwaggerApiResponseData({
    dataClass: AuthResponseDto,
    status: HttpStatus.OK,
    description: 'Account token refreshed',
  })
  @Post('refresh/token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenRequestDto: RefreshTokenRequestDto,
    @Req() request: Request,
  ): Promise<ApiResponse<AuthResponseDto>> {
    const response: AuthResponseDto = await this.authService.refreshToken(
      refreshTokenRequestDto,
      request,
    );
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Api endpoint for forgot password request' })
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
    description: 'Reset password OTP sent to email',
  })
  async forgotPassword(
    @Body() forgotPasswordRequest: ForgotPasswordRequestDto,
  ): Promise<ApiResponse<string>> {
    const response: string = await this.authService.forgotPassword(
      forgotPasswordRequest,
    );
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @Public()
  @Post('/verify/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Api endpoint for verifying forgot password OTP' })
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
    description: 'Password reset OTP verified',
  })
  async verifyForgotPassword(
    @Body() verifyForgotPasswordRequest: VerifyForgotPasswordRequestDto,
  ): Promise<ApiResponse<string>> {
    const response: string = await this.authService.verifyForgotPassword(
      verifyForgotPasswordRequest,
    );
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Api endpoint for resetting password' })
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  async resetPassword(
    @Body() resetPasswordRequest: ResetPasswordRequestDto,
  ): Promise<ApiResponse<string>> {
    const response: string =
      await this.authService.resetPassword(resetPasswordRequest);
    return ApiResponse.success(response, HttpStatus.OK);
  }
}
