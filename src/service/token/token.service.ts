import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { Repository } from 'typeorm';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { User } from 'src/user/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { DateUtility } from 'src/utility/date-utility';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ConfigInterface } from 'src/config-module/configuration';
import { UserType } from '../user/enum/user-type.enum';

@Injectable()
export class TokenService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    TokenService.name,
  );
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly configService: ConfigService<ConfigInterface>,
  ) {}

  async createToken(user: User, request: Request): Promise<Token> {
    const userAgent: string = request.get('user-agent')!;
    const ip =
      this.configService.get('app.env', { infer: true }) === 'prod'
        ? (request.headers['x-forwarded-for'] as string) ||
          request.ip ||
          request.socket.remoteAddress
        : request.ip || request.socket.remoteAddress;

    const expireAt: Date =
      user.userType == UserType.PATIENT
        ? DateUtility.addDay(
            this.configService.get('token.refreshExpire', { infer: true })!,
          )
        : DateUtility.addDay(user.organization.refreshTokenTime);

    const token: Token = this.tokenRepository.create({
      expireAt,
      refreshToken: uuidv4(),
      ip,
      user,
      userAgent,
    });
    const newToken: Token = await this.tokenRepository.save(token);

    this.logger.log(`Refresh token Created`, TokenService.name);
    return newToken;
  }

  async verifyToken(refreshToken: string, userId: string): Promise<Token> {
    const token: Token | null = await this.tokenRepository.findOne({
      where: { refreshToken },
      relations: ['user'],
    });

    if (!token || token.user.id !== userId) {
      throw new UnauthorizedException('Invalid Token Credentials');
    }

    if (token.expireAt < DateUtility.currentDate || !token.valid) {
      await this.revokeToken(refreshToken);
      throw new UnauthorizedException('Token Expired');
    }

    return token;
  }

  public async revokeToken(
    refreshToken?: string,
    token?: Token,
  ): Promise<void> {
    const findToken: Token | null = token
      ? token
      : await this.tokenRepository.findOne({
          where: {
            refreshToken,
          },
        });

    if (!findToken) {
      throw new UnauthorizedException('Invalid Token');
    }

    if (!findToken.valid) {
      throw new BadRequestException('Token already revoked');
    }

    findToken.valid = false;
    await this.tokenRepository.save(findToken);
  }
}
