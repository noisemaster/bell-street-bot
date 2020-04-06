import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import { User } from "./User";

@Entity()
export class TurnipBuy extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    datePurchased: Date;

    @Column()
    price: number;

    @Column()
    amount: number;

    @ManyToOne(type => User, user => user.prices)
    user: User;
}
