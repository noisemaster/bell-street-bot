import Eris from "eris";
import { User } from "./models/User";
import moment from 'moment';
import { TurnipPrice } from "./models/TurnipPrice";
import { Between } from 'typeorm';

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

        await msg.channel.createMessage('✅ Saved')
    } else if (msg.content.startsWith('t!view')) {
        await getTurnipPrice(msg.author, msg)
    } else if (msg.content.startsWith('t!peek')) {
        const { mentions } = msg;
        if (mentions.length === 0) {
            await msg.channel.createMessage('`t!peek <@mention>`');
            return;
        }

        const [mentionedUser] = mentions;
        await getTurnipPrice(mentionedUser, msg);
    }
});

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