import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Verification } from '../../model/entity/verification.entity';
import { Repository } from 'typeorm';
import { VerificationRequest } from '../../model/request/verification-request.dto';
import { HashUtility } from 'src/utility/hash-utility';
import { MyLoggerService } from '../logger/my-logger.service';
import { ConfigService } from '@nestjs/config';
import { ConfigInterface } from 'src/config-module/configuration';
import { DateUtility } from 'src/utility/date-utility';
import { EmailEvent } from '../email/email-event.service';
import { EmailType } from '../../model/enum/email-type.enum';
import { VerificationType } from '../../model/enum/verification-type';

@Injectable()
export class VerificationService {
  private logger: MyLoggerService = new MyLoggerService(
    VerificationService.name,
  );

  constructor(
    @InjectRepository(Verification)
    private readonly verificationRepository: Repository<Verification>,
    private readonly emailEvent: EmailEvent,
    private readonly configService: ConfigService<ConfigInterface>,
  ) {}

  async create(verificationRequest: VerificationRequest): Promise<void> {
    const { tokenType, user, verificationType }: VerificationRequest =
      verificationRequest;

    const verification: Verification | null = await this.findVerification(
      verificationType,
      user.email,
    );

    if (verification) {
      await this.verificationRepository.remove(verification);
    }

    const token: string =
      tokenType === 'token'
        ? HashUtility.generateRandomHash()
        : HashUtility.generateSecureNumber();

    const savedVerification: Verification = this.verificationRepository.create({
      token: await HashUtility.generateHashValue(token),
      verificationType,
      destination: user.email,
      expireAt: DateUtility.addMinutes(15),
    });
    await this.verificationRepository.save(savedVerification);

    const context: { [index: string]: any } = {
      name: user !== null ? user.firstName : 'user',
    };

    if (tokenType === 'token') {
      context.verificationLink = `${this.configService.get('app.frontendHost', { infer: true })}/verifyUser/?token=${token}&email=${user.email}`;
    } else {
      context.token = token;
    }

    await this.emailEvent.sendEmailRequest({
      type: verificationType as unknown as EmailType,
      to: user.email,
      context,
    });

    this.logger.log(
      `Verification of type: ${verificationType} sent`,
      VerificationService.name,
    );
  }

  async verify(
    verificationRequest: VerificationRequest,
    token: string,
  ): Promise<void> {
    const { user, verificationType } = verificationRequest;

    const verification: Verification | null = await this.findVerification(
      verificationType,
      user.email,
    );

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    const currentTime: Date = DateUtility.currentDate;
    if (verification.expireAt < currentTime) {
      await this.verificationRepository.delete(verification);
      throw new BadRequestException('Expired Verification');
    }

    if (!(await HashUtility.compareHash(token, verification.token))) {
      throw new BadRequestException('Invalid Verification');
    }

    verification.verified = true;
    verification.expireAt = DateUtility.addMinutes(15);

    await this.verificationRepository.save(verification);

    this.logger.log(
      `Verification of type: ${verificationType} verified`,
      VerificationService.name,
    );
  }

  async delete(verifyRequest: VerificationRequest): Promise<void> {
    const { verificationType, user }: VerificationRequest = verifyRequest;

    const verification: Verification | null =
      await this.verificationRepository.findOne({
        where: { destination: user.email, verificationType },
      });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    const currentTime: Date = DateUtility.currentDate;
    if (verification.expireAt < currentTime) {
      await this.verificationRepository.delete(verification);
      throw new BadRequestException('Expired Verification');
    }

    if (!verification.verified) {
      throw new NotFoundException('Verification not verified');
    }

    await this.verificationRepository.softRemove(verification);
    this.logger.log(
      `Verification of type: ${verificationType} deleted`,
      VerificationService.name,
    );
  }

  private async findVerification(
    verificationType: VerificationType,
    destination: string,
  ): Promise<Verification | null> {
    return await this.verificationRepository.findOneBy({
      verificationType,
      destination,
    });
  }
}
