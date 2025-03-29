import { BadRequestException, Injectable } from '@nestjs/common';
import { MyLoggerService } from '../logger/my-logger.service';
import { User } from '../../model/entity/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { RegisterRequestDto } from '../../model/request/register-request.dto';
import { HashUtility } from '../../utility/hash-utility';
import { UserRole } from '../../model/enum/role.enum';
import { VerificationType } from '../../model/enum/verification-type';
import { VerificationService } from '../verification/verification.service';
import { AuthResponseDto } from '../../model/response/auth-response.dto';
import { VerifyRegistrationDto } from '../../model/request/verify-registration.dto';
import { DateUtility } from '../../utility/date-utility';
import { EmailService } from '../email/email.service';
import { EmailType } from '../../model/enum/email-type.enum';
import { Request } from 'express';
import { TokenService } from '../token/token.service';
import { CustomJwtService } from '../token/jwt.service';
import { AuthRequestDto } from '../../model/request/auth-request.dto';
import { LogoutRequestDto } from '../../model/request/logout-request.dto';
import { UserInfo } from '../../common/guards/auth.guard';
import { RefreshTokenRequestDto } from '../../model/request/refresh-token-request.dto';
import { VerifyForgotPasswordRequestDto } from 'src/model/request/verify-forgot-password-request.dto';
import { ForgotPasswordRequestDto } from '../../model/request/forgot-password-request.dto';
import { ResetPasswordRequestDto } from '../../model/request/reset-password-request.dto';

@Injectable()
export class AuthService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    AuthService.name,
  );

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly jwtService: CustomJwtService,
  ) {}

  async registerUser(registerRequestDto: RegisterRequestDto): Promise<string> {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      username,
      isAgreed,
    }: RegisterRequestDto = registerRequestDto;

    let user: User | null = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (user && user.isEnabled) {
      throw new BadRequestException('Account with email already exists');
    }

    if (user && !user.isEnabled) {
      await this.userRepository.remove(user);
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords fields do not match');
    }

    user = this.userRepository.create({
      firstName,
      lastName,
      email,
      username,
      passwordHash: await HashUtility.generateHashValue(password),
      role: UserRole.USER,
      isAgreed,
    });

    const newUser: User = await this.userRepository.save(user);
    await this.verificationService.create({
      verificationType: VerificationType.ACCOUNTVERIFICATION,
      user: newUser,
      tokenType: 'otp',
    });

    this.logger.log(`User Created: ${newUser.email}`, AuthService.name);
    return 'Confirm your account in the email sent';
  }

  async verifyRegistration(
    verifyRegistration: VerifyRegistrationDto,
    request: Request,
  ): Promise<AuthResponseDto> {
    const { token, email }: VerifyRegistrationDto = verifyRegistration;

    const user: User | null = await this.userRepository.findOne({
      where: {
        email,
      },
      relations: ['address'],
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    await this.verificationService.verify(
      {
        user,
        verificationType: VerificationType.ACCOUNTVERIFICATION,
        tokenType: 'otp',
      },
      token,
    );

    user.isEnabled = true;
    user.lastLogin = DateUtility.currentDate;

    await this.emailService.sendRegistrationNotificationMail({
      to: user.email,
      type: EmailType.ACCOUNTREGISTRATION,
      context: {
        name: user.firstName,
      },
    });

    const tokens = await this.generateToken(user, request, true);

    this.logger.log(`Verified user: ${user.email}`, AuthService.name);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken!,
      user: this.userService.convertToDto(user),
    };
  }

  async login(
    loginRequestDto: AuthRequestDto,
    request: Request,
  ): Promise<AuthResponseDto> {
    const { email, username, password }: AuthRequestDto = loginRequestDto;

    const user: User | null = await this.userRepository.findOne({
      where: {
        email,
      },
      relations: ['address'],
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!user.isEnabled) {
      throw new BadRequestException('Account is not verified');
    }

    if (!(await HashUtility.compareHash(password, user.passwordHash))) {
      throw new BadRequestException('Invalid credentials');
    }

    user.lastLogin = DateUtility.currentDate;
    await this.userRepository.save(user);

    const tokens = await this.generateToken(user, request, true);

    this.logger.log(`User: ${user.email} logged in`, AuthService.name);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken!,
      user: this.userService.convertToDto(user),
    };
  }

  async logout(
    logoutRequestDto: LogoutRequestDto,
    request: Request,
  ): Promise<string> {
    const { refreshToken }: LogoutRequestDto = logoutRequestDto;
    const userInfo: UserInfo = request.user!;

    const user: User | null = await this.userRepository.findOne({
      where: {
        id: userInfo.userId,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    await this.tokenService.revokeToken(refreshToken);

    this.logger.log(`User logged out: ${userInfo.userId}`);

    request.user = undefined;
    return 'User logged out successfully';
  }

  async refreshToken(
    refershTokenRequest: RefreshTokenRequestDto,
    request: Request,
  ): Promise<AuthResponseDto> {
    const { refreshToken, userId }: RefreshTokenRequestDto =
      refershTokenRequest;

    await this.tokenService.verifyToken(refreshToken, userId);

    const user: User | null = await this.userRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['address'],
    });

    if (!user) {
      throw new BadRequestException('Invalid Credentials');
    }

    const tokens = await this.generateToken(user, request, false);

    this.logger.log(`User refreshed token`, AuthService.name);
    return {
      accessToken: tokens.accessToken,
      refreshToken: refreshToken,
      user: this.userService.convertToDto(user),
    };
  }

  async forgotPassword(
    forgotPasswordRequest: ForgotPasswordRequestDto,
  ): Promise<string> {
    const { email }: ForgotPasswordRequestDto = forgotPasswordRequest;

    const user: User | null = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      return 'Reset password link sent to your email';
    }

    await this.verificationService.create({
      verificationType: VerificationType.PASSWORDRESET,
      tokenType: 'otp',
      user,
    });

    this.logger.log(
      `Password reset request processed for user: ${user.email}`,
      AuthService.name,
    );
    return 'Reset password otp sent to your email';
  }

  async verifyForgotPassword(
    verifyForgotPasswordRequest: VerifyForgotPasswordRequestDto,
  ): Promise<string> {
    const { email, token }: VerifyForgotPasswordRequestDto =
      verifyForgotPasswordRequest;

    const user: User | null = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid Verification');
    }

    await this.verificationService.verify(
      {
        verificationType: VerificationType.PASSWORDRESET,
        tokenType: 'otp',
        user,
      },
      token,
    );

    this.logger.log(
      `Password reset request verified: ${user.email}`,
      AuthService.name,
    );
    return 'Password reset otp verified, Proceed to reset password';
  }

  async resetPassword(
    resetPasswordRequest: ResetPasswordRequestDto,
  ): Promise<string> {
    const { email, password, confirmPassword } = resetPasswordRequest;

    const user: User | null = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid email');
    }

    await this.verificationService.delete({
      user,
      verificationType: VerificationType.PASSWORDRESET,
      tokenType: 'otp',
    });

    if (password !== confirmPassword) {
      throw new BadRequestException('Password fields are not the same');
    }

    user.passwordHash = await HashUtility.generateHashValue(password);
    await this.userRepository.save(user);

    this.logger.log(`User reset password`, AuthService.name);
    return 'Password change successfully';
  }

  private async generateToken(
    user: User,
    request: Request,
    isRefreshTokenRefresh: boolean = false,
  ): Promise<{ accessToken: string; refreshToken: string | null }> {
    return {
      accessToken: this.jwtService.generateJwtToken(user),
      refreshToken: isRefreshTokenRefresh
        ? (await this.tokenService.createToken(user, request)).refreshToken
        : null,
    };
  }
}
