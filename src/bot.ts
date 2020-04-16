import Eris from "eris";
import { User } from "./models/User";
import moment from 'moment';
import { TurnipPrice } from "./models/TurnipPrice";
import { Between } from 'typeorm';
import { TurnipBuy } from "./models/TurnipBuy";
import { TurnipSell } from "./models/TurnipSell";

const bot = Eris(process.env.DISCORD_TOKEN);

bot.on('ready', () => {
    console.log('Ready');
});

bot.on('messageCreate', async msg => {
    msg.content = msg.content.trim();
    
    if (msg.content.startsWith('t!turnip')) {
        let user = await User.findOne({
            where: {
                discordId: msg.author.id
            }
        });

        if (!user) {
            user = new User();
            user.discordId = msg.author.id;
            user.name = msg.author.username;
            await user.save();
        }

        console.log(`User: ${user.name} - Discord ID: ${user.discordId} - Name: ${user.name}`);

        const rawContent = msg.content.replace('t!turnip', '').trim();
        const args = rawContent.toLowerCase().split(' ');
        console.log(args);

        if (args.length < 3) {
            await msg.channel.createMessage('Expected Format\n`t!turnip <day of week> <am|pm> <price>`')
            return
        }

        let timestamp = moment().day(args[0]);
        if (args[1] === 'am') {
            timestamp = timestamp.hour(9).startOf('hour');
        } else if (args[1] === 'pm') {
            timestamp = timestamp.hour(13).startOf('hour');
        } else {
            await msg.channel.createMessage('Expected Format\n`t!turnip <day of week> <am|pm> <price>`')
            return;
        }

        const turnipPrice = parseInt(args[2], 10);
        if (isNaN(turnipPrice)) {
            await msg.channel.createMessage('Expected Format\n`t!turnip <day of week> <am|pm> <price>`')
            return;
        }

        if (turnipPrice <= 0) {
            await msg.channel.createMessage('Turnip price given is negative')
            return;
        }

        const turnip = new TurnipPrice();
        turnip.price = turnipPrice;
        turnip.dateAdded = timestamp.toDate();
        turnip.user = user;
        await turnip.save();

        await msg.channel.createMessage('✅ Saved');

        const timeStart = moment().day('Sunday').startOf('day').toDate();
        const timeEnd = moment().day('Saturday').endOf('day').toDate();
    
        const buys = await TurnipBuy.find({
            where: {
                datePurchased: Between(timeStart, timeEnd),
                user: user
            },
            order: {
                datePurchased: 'ASC'
            }
        });
    
        if (buys.length === 0) {
            return;
        }

        const totalBells = buys.reduce((acc, buy) => acc + (buy.amount * buy.price), 0);
        const totalTurnips = buys.reduce((acc, buy) => acc + buy.amount, 0);

        const perspectiveSell = totalTurnips * turnipPrice;
        const sellDifference = perspectiveSell - totalBells;

        await msg.channel.createMessage(`If you sell your ${totalTurnips} turnips now, you'll get ${perspectiveSell} Bells (a ${sellDifference > 0 ? 'profit' : 'loss'} of ${Math.abs(sellDifference)} Bells)`);
    } else if (msg.content.startsWith('t!view')) {
        await getTurnipPrice(msg.author, msg)
        await getTurnipBuys(msg.author, msg)
    } else if (msg.content.startsWith('t!peek')) {
        const { mentions } = msg;
        if (mentions.length === 0) {
            await msg.channel.createMessage('`t!peek <@mention>`');
            return;
        }

        const [mentionedUser] = mentions;
        await getTurnipPrice(mentionedUser, msg);
    } else if (msg.content.startsWith('t!buy')) {
        let user = await User.findOne({
            where: {
                discordId: msg.author.id
            }
        });

        if (!user) {
            user = new User();
            user.discordId = msg.author.id;
            user.name = msg.author.username;
            await user.save();
        }

        const saveTime = moment().day('Sunday').hour(9).startOf('hour').toDate();
        const rawContent = msg.content.replace('t!buy', '').trim();
        const args = rawContent.toLowerCase().split(' ');
        
        console.log(args);
        if (args.length < 2) {
            await msg.channel.createMessage('Expected Format\n`t!buy <turnips bought> <price bought>`')
            return
        }

        const amount = parseInt(args[0]);
        const price = parseInt(args[1]);

        if (isNaN(amount) || isNaN(price)) {
            await msg.channel.createMessage('Expected Format\n`t!buy <turnips bought> <price bought>`')
            return
        }

        if (amount < 0) {
            await msg.channel.createMessage('You can\'t buy a negative amount of turnips')
            return
        }

        if (price < 0) {
            await msg.channel.createMessage('You can\'t buy with a negative price')
            return
        }

        const buy = new TurnipBuy();
        buy.amount = amount;
        buy.price = price;
        buy.datePurchased = saveTime;
        buy.user = user;
        await buy.save();

        await msg.channel.createMessage('✅ Saved');
    } else if (msg.content.startsWith('t!sell')) {
        let user = await User.findOne({
            where: {
                discordId: msg.author.id
            }
        });

        if (!user) {
            user = new User();
            user.discordId = msg.author.id;
            user.name = msg.author.username;
            await user.save();
        }

        const saveTime = moment().toDate();
        const rawContent = msg.content.replace('t!sell', '').trim();
        const args = rawContent.toLowerCase().split(' ');
        
        console.log(args);
        if (args.length < 2) {
            await msg.channel.createMessage('Expected Format\n`t!sell <turnips sold> <price sold>`')
            return
        }

        let amount = parseInt(args[0]);
        const price = parseInt(args[1]);

        if (isNaN(amount) || isNaN(price)) {
            await msg.channel.createMessage('Expected Format\n`t!sell <turnips sold> <price sold>`')
            return
        }

        const timeStart = moment().day('Sunday').startOf('day').toDate();
        const timeEnd = moment().day('Saturday').endOf('day').toDate();    

        const thisWeeksBuy = await TurnipBuy.find({
            where: {
                datePurchased: Between(timeStart, timeEnd),
                user,    
            }
        });

        const totalTurnips = thisWeeksBuy.reduce((acc, buy) => acc + buy.amount, 0)
        const totalPrice = thisWeeksBuy.reduce((acc, buy) => acc + (buy.amount * buy.price), 0);

        if (amount < 0) {
            await msg.channel.createMessage('You can\'t sell a negative amount of turnips')
            return
        }

        if (price < 0) {
            await msg.channel.createMessage('You can\'t sell with a negative price')
            return
        }

        if (amount > totalTurnips) {
            amount = totalTurnips;
        }

        const sellPrice = amount * price;

        const sell = new TurnipSell();
        sell.amount = amount;
        sell.price = price;
        sell.dateSold = saveTime;
        sell.user = user;
        await sell.save();

        const net = sellPrice - totalPrice;

        await msg.channel.createMessage(`Sold ${amount.toLocaleString()} Turnips at ${price} Bells - ${net > 0 ? 'Profit' : 'Loss'} of ${Math.abs(net).toLocaleString()} Bells`);
    }
});

const getTurnipBuys = async (user: Eris.User, msg: Eris.Message) => {
    const timeStart = moment().day('Sunday').startOf('day').toDate();
    const timeEnd = moment().day('Saturday').endOf('day').toDate();
    const dbUser = await User.findOne({
        where: {
            discordId: user.id
        }
    });

    if (!dbUser) {
        await msg.channel.createMessage('User hasn\'t submitted any turnip prices');
        return;
    }

    const buys = await TurnipBuy.find({
        where: {
            datePurchased: Between(timeStart, timeEnd),
            user: dbUser
        },
        order: {
            datePurchased: 'ASC'
        }
    });

    if (buys.length === 0) {
        return;
    }

    const formattedBuys = buys.map(x => {
        return `${x.amount.toLocaleString()}@${x.price} Bells for ${(x.amount * x.price).toLocaleString()} Bells`;
    }).join('\n');

    const total = buys.reduce((acc, buy) => acc + (buy.amount * buy.price), 0);

    const totalBuy = `Total: ${total.toLocaleString()} Bells`;

    await bot.createMessage(msg.channel.id, {
        embed: {
            title: `${user.username}'s Turnip Buys`,
            description: `${formattedBuys}\n${totalBuy}`,
            author: {
                name: user.username,
                icon_url: user.avatarURL
            },
            color: 0xd38c3f
        }
    });
};

const getTurnipPrice = async (user: Eris.User, msg: Eris.Message) => {
    const timeStart = moment().day('Sunday').startOf('day').toDate();
    const timeEnd = moment().day('Saturday').endOf('day').toDate();
    const dbUser = await User.findOne({
        where: {
            discordId: user.id
        }
    });

    if (!dbUser) {
        await msg.channel.createMessage('User hasn\'t submitted any turnip prices');
        return;
    }

    const turnips = await TurnipPrice.find({
        where: {
            dateAdded: Between(timeStart, timeEnd),
            user: dbUser
        },
        order: {
            dateAdded: 'ASC'
        }
    });

    const formattedTurnips = turnips.map(x => {
        const time = moment(x.dateAdded);
        const timeframe = time.hour() > 12 ? 'PM' : 'AM';

        return `${time.format('dddd MMMM D')} ${timeframe} - ${x.price} Bells`;
    }).join('\n');

    await bot.createMessage(msg.channel.id, {
        embed: {
            title: `${user.username}'s Turnip Prices`,
            description: formattedTurnips,
            author: {
                name: user.username,
                icon_url: user.avatarURL
            },
            color: 0xd38c3f
        }
    });
}

export default bot;