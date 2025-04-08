import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../../model/entity/user.entity';
import { UserDto } from '../../model/dto/user.dto';
import { MyLoggerService } from '../logger/my-logger.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaginationAndSorting,
  PaginationAndSortingResult,
  PaginationQueryDto,
} from '../../utility/pagination-and-sorting';
import { UpdateUserRequestDto } from '../../model/request/update-user-request.dto';
import { UpdatePasswordRequestDto } from '../../model/request/update-password-request.dto';
import { HashUtility } from '../../utility/hash-utility';
import { FileService } from '../file/file.service';
import { FileType } from '../../model/enum/file-type.enum';

@Injectable()
export class UserService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    UserService.name,
  );

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly fileService: FileService,
  ) {}

  async findAll(
    userQuery: PaginationQueryDto,
  ): Promise<PaginationAndSortingResult<UserDto>> {
    const findOptions = PaginationAndSorting.createFindOptions<User>(
      ['firstName', 'lastName', 'email'],
      userQuery,
      {},
      {},
      ['address'],
    );
    const [users, count] = await this.userRepository.findAndCount(findOptions);

    return PaginationAndSorting.getPaginateResult<User, UserDto>(
      users,
      count,
      userQuery,
      (user: User) => this.convertToDto(user),
    );
  }

  async findSingleUser(userId: string): Promise<UserDto> {
    const user: User = await this.findById(userId, ['address', 'profileImage']);

    this.logger.log(`Retrieved user with id: ${user.id}`, UserService.name);
    return this.convertToDto(user);
  }

  async updateUser(
    userId: string,
    updateRequest: UpdateUserRequestDto,
  ): Promise<UserDto> {
    const {
      firstName,
      lastName,
      email,
      username,
      address,
      city,
      state,
      profileImageUrl,
      phoneNumber,
      dob,
    }: UpdateUserRequestDto = updateRequest;

    let user: User = await this.findById(userId, ['address', 'profileImage']);

    if (firstName) {
      user.firstName = firstName;
    }

    if (lastName) {
      user.lastName = lastName;
    }

    if (email) {
      user.email = email;
    }

    if (dob) {
      user.dob = dob;
    }

    if (username) {
      user.username = username;
    }

    if (phoneNumber) {
      user.phoneNumber = phoneNumber;
    }

    if (profileImageUrl) {
      if (user.profileImage) {
        await this.fileService.updateFile(
          user.profileImage,
          null,
          FileType.PROFILE_PICTURE,
        );
      }
      user.profileImage = await this.fileService.updateWithUrl(
        profileImageUrl,
        user,
        FileType.PROFILE_PICTURE,
      );
    }

    if (address) {
      if (!city || !state) {
        throw new BadRequestException(
          'City and state are required when modifying address',
        );
      }

      user.address.address = address;
      user.address.state = state;
      user.address.city = city;
    }

    user = await this.userRepository.save(user);

    this.logger.log(
      `User with id: ${user.id} was updated successfully.`,
      UserService.name,
    );
    return this.convertToDto(user);
  }

  async updatePassword(
    userId: string,
    passwordRequest: UpdatePasswordRequestDto,
  ): Promise<string> {
    const {
      oldPassword,
      newPassword,
      confirmPassword,
    }: UpdatePasswordRequestDto = passwordRequest;

    const user: User = await this.findById(userId);

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password field are not the same');
    }

    if (!(await HashUtility.compareHash(oldPassword, user.passwordHash))) {
      throw new BadRequestException('Incorrect old password');
    }

    user.passwordHash = await HashUtility.generateHashValue(newPassword);
    await this.userRepository.save(user);

    this.logger.log(`User changed password`, UserService.name);
    return 'Password changed successfully';
  }

  async findById(id: string, relations: string[] = []): Promise<User> {
    const user: User | null = await this.userRepository.findOne({
      where: { id },
      relations,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string, relations: string[] = []): Promise<User> {
    const user: User | null = await this.userRepository.findOne({
      where: { email },
      relations,
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  convertToDto(user: User): UserDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
      dob: user.dob,
      phoneNumber: user.phoneNumber,
      address: user.address.address ?? null,
      city: user.address.address,
      state: user.address.state,
      lastLogin: user.lastLogin,
      profileImage: user.profileImage ? user.profileImage.url : null,
      is2fa: user.is2fa,
      isVerified: user.isVerified,
      isGoogleLogin: user.isGoogleLogin,
      isEnabled: user.isEnabled,
    };
  }
}
