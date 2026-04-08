import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationPackage } from '../../model/entity/verification-package.entity';
import { CreateVerificationPackageDto } from '../../model/request/create-verification-package.dto';
import { UpdateVerificationPackageDto } from '../../model/request/update-verification-package.dto';

@Injectable()
export class VerificationPackageService implements OnModuleInit {
    private readonly DEFAULT_PACKAGES: Partial<VerificationPackage>[] = [
        {
            name: 'Basic Verification',
            description:
                'Survey inspection and title document verification. Confirms property boundaries, validates ownership documentation, and provides a summary verification certificate.',
            price: 150000,
            isActive: true,
            sortOrder: 1,
        },
        {
            name: 'Standard Verification',
            description:
                'Title verification with registry search and encumbrance checks. Includes boundary survey, ownership validation, lien and debt clearance confirmation, and a detailed status report.',
            price: 350000,
            isActive: true,
            sortOrder: 2,
        },
        {
            name: 'Premium Verification',
            description:
                'Full due diligence with legal review and comprehensive report. Covers survey inspection, title search, encumbrance checks, regulatory compliance audit, risk assessment, and a certified verification report.',
            price: 750000,
            isActive: true,
            sortOrder: 3,
        },
    ];

    constructor(
        @InjectRepository(VerificationPackage)
        private readonly packageRepository: Repository<VerificationPackage>,
    ) {}

    async onModuleInit(): Promise<void> {
        await this.seedDefaultPackages();
    }

    private async seedDefaultPackages(): Promise<void> {
        const count = await this.packageRepository.count();
        if (count > 0) return;

        for (const pkg of this.DEFAULT_PACKAGES) {
            const entity = this.packageRepository.create(pkg);
            await this.packageRepository.save(entity);
        }
    }

    async findAllActive(): Promise<VerificationPackage[]> {
        return this.packageRepository.find({
            where: { isActive: true },
            order: { sortOrder: 'ASC' },
        });
    }

    async findAll(): Promise<VerificationPackage[]> {
        return this.packageRepository.find({
            order: { sortOrder: 'ASC' },
        });
    }

    async findById(id: string): Promise<VerificationPackage> {
        const pkg = await this.packageRepository.findOne({ where: { id } });
        if (!pkg) {
            throw new NotFoundException('Verification package not found');
        }
        return pkg;
    }

    async create(dto: CreateVerificationPackageDto): Promise<VerificationPackage> {
        const entity = this.packageRepository.create(dto);
        return this.packageRepository.save(entity);
    }

    async update(id: string, dto: UpdateVerificationPackageDto): Promise<VerificationPackage> {
        const pkg = await this.findById(id);
        Object.assign(pkg, dto);
        return this.packageRepository.save(pkg);
    }

    async remove(id: string): Promise<void> {
        const pkg = await this.findById(id);
        await this.packageRepository.softRemove(pkg);
    }
}
