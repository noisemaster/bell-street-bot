import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import { User } from "./User";

@Entity()
export class TurnipPrice extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    dateAdded: Date;

    @Column()
    price: number;

    @ManyToOne(type => User, user => user.prices)
    user: User;
}
