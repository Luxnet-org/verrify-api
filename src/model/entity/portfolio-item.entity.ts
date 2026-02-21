import { Entity, JoinColumn, ManyToOne, Index } from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { User } from './user.entity';
import { Property } from './property.entity';

@Entity('portfolio_items')
export class PortfolioItem extends Auditable {
    @Index()
    @ManyToOne(() => User)
    @JoinColumn()
    user: User;

    @Index()
    @ManyToOne(() => Property)
    @JoinColumn()
    property: Property;
}
