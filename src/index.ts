import "reflect-metadata";
import {createConnection} from "typeorm";
import bot from "./bot";

const startBot = async () => {
    try {
        const connection = await createConnection();
        bot.connect();
    } catch (err) {
        console.error(err);
    }
} 

startBot();