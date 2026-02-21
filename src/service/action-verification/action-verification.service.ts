import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActionVerification } from '../../model/entity/action-verification.entity';
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
export class ActionVerificationService {
  private logger: MyLoggerService = new MyLoggerService(
    ActionVerificationService.name,
  );

  constructor(
    @InjectRepository(ActionVerification)
    private readonly actionVerificationRepository: Repository<ActionVerification>,
    private readonly emailEvent: EmailEvent,
    private readonly configService: ConfigService<ConfigInterface>,
  ) { }

  async create(verificationRequest: VerificationRequest): Promise<void> {
    const { tokenType, user, verificationType }: VerificationRequest =
      verificationRequest;

    const actionVerification: ActionVerification | null = await this.findVerification(
      verificationType,
      user.email,
    );

    if (actionVerification) {
      await this.actionVerificationRepository.remove(actionVerification);
    }

    const token: string =
      tokenType === 'token'
        ? HashUtility.generateRandomHash()
        : HashUtility.generateSecureNumber();

    const savedVerification: ActionVerification = this.actionVerificationRepository.create({
      token: await HashUtility.generateHashValue(token),
      verificationType,
      destination: user.email,
      expireAt: DateUtility.addMinutes(15),
    });
    await this.actionVerificationRepository.save(savedVerification);

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
      ActionVerificationService.name,
    );
  }

  async verify(
    verificationRequest: VerificationRequest,
    token: string,
  ): Promise<void> {
    const { user, verificationType } = verificationRequest;

    const actionVerification: ActionVerification | null = await this.findVerification(
      verificationType,
      user.email,
    );

    if (!actionVerification) {
      throw new NotFoundException('Verification not found');
    }

    const currentTime: Date = DateUtility.currentDate;
    if (actionVerification.expireAt < currentTime) {
      await this.actionVerificationRepository.delete(actionVerification);
      throw new BadRequestException('Expired Verification');
    }

    if (!(await HashUtility.compareHash(token, actionVerification.token))) {
      throw new BadRequestException('Invalid Verification');
    }

    actionVerification.verified = true;
    actionVerification.expireAt = DateUtility.addMinutes(15);

    await this.actionVerificationRepository.save(actionVerification);

    this.logger.log(
      `Verification of type: ${verificationType} verified`,
      ActionVerificationService.name,
    );
  }

  async delete(verifyRequest: VerificationRequest): Promise<void> {
    const { verificationType, user }: VerificationRequest = verifyRequest;

    const actionVerification: ActionVerification | null =
      await this.actionVerificationRepository.findOne({
        where: { destination: user.email, verificationType },
      });

    if (!actionVerification) {
      throw new NotFoundException('Verification not found');
    }

    const currentTime: Date = DateUtility.currentDate;
    if (actionVerification.expireAt < currentTime) {
      await this.actionVerificationRepository.delete(actionVerification);
      throw new BadRequestException('Expired Verification');
    }

    if (!actionVerification.verified) {
      throw new NotFoundException('Verification not verified');
    }

    await this.actionVerificationRepository.softRemove(actionVerification);
    this.logger.log(
      `Verification of type: ${verificationType} deleted`,
      ActionVerificationService.name,
    );
  }

  private async findVerification(
    verificationType: VerificationType,
    destination: string,
  ): Promise<ActionVerification | null> {
    return await this.actionVerificationRepository.findOneBy({
      verificationType,
      destination,
    });
  }
}
