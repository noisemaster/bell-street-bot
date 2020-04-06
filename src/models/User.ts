import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany} from "typeorm";
import { TurnipPrice } from "./TurnipPrice";
import { TurnipBuy } from "./TurnipBuy";

@Entity({
    name: 'users'
})
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    discordId: string;

    @Column()
    name: string;

    @OneToMany(type => TurnipPrice, price => price.user)
    prices: TurnipPrice[]

    @OneToMany(type => TurnipBuy, buy => buy.user)
    buys: TurnipPrice[]
}
