import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { User } from './user.entity';
import { Company } from './company.entity';

@Entity('location')
export class LocationEntity extends Auditable {
  @Column({ type: 'character varying', nullable: true })
  country: string;

  @Column({ type: 'character varying', nullable: true })
  state: string;

  @Column({ type: 'character varying', nullable: true })
  city: string;

  @Column({ type: 'character varying', nullable: true })
  address: string;

  @Column({ type: 'character varying', nullable: true })
  location: string;

  @Column({ type: 'character varying', nullable: true })
  locationPolygon: string;

  @OneToOne(() => User, (user) => user.address)
  @JoinColumn()
  user: User;

  @OneToOne(() => Company, (company) => company.address)
  @JoinColumn()
  company: Company;
}
