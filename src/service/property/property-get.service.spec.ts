import type { Repository } from 'typeorm';
import type { Property } from '../../model/entity/property.entity';
import type { LocationEntity } from '../../model/entity/location.entity';
import type { CompanyService } from '../company/company.service';
import type { UserService } from '../user/user.service';
import type { PropertyHelperService } from './property-helper.service';
import type { PropertyVersionService } from './version/property-version.service';
import type { FileService } from '../file/file.service';
import { PropertyType } from '../../model/enum/property-type.enum';
import { UserRole } from '../../model/enum/role.enum';
import { NearbyQueryDto } from '../../model/request/property-view-query.dto';
import { PropertyGetService } from './property-get.service';

describe('PropertyGetService.getNearbyProperties', () => {
  let service: PropertyGetService;
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    addSelect: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    andWhere: jest.Mock;
    getManyAndCount: jest.Mock;
  };

  beforeEach(() => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    const locationRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as Repository<LocationEntity>;
    const userService = {
      findById: jest.fn().mockResolvedValue({ role: UserRole.USER }),
    } as unknown as UserService;

    service = new PropertyGetService(
      {} as Repository<Property>,
      locationRepository,
      {} as CompanyService,
      userService,
      {} as PropertyHelperService,
      {} as PropertyVersionService,
      {} as FileService,
    );
  });

  it('filters nearby properties by the requested property type', async () => {
    await service.getNearbyProperties('user-id', {
      latitude: 6.5,
      longitude: 3.4,
      radiusKm: 5,
      propertyType: PropertyType.LAND,
      page: 1,
      limit: 20,
    } as NearbyQueryDto);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'property.propertyType = :propertyType',
      { propertyType: PropertyType.LAND },
    );
  });

  it('leaves nearby properties unrestricted by type when omitted', async () => {
    await service.getNearbyProperties('user-id', {
      latitude: 6.5,
      longitude: 3.4,
      radiusKm: 5,
      page: 1,
      limit: 20,
    } as NearbyQueryDto);

    expect(queryBuilder.andWhere).not.toHaveBeenCalledWith(
      'property.propertyType = :propertyType',
      expect.anything(),
    );
  });
});
