import { Client, GatewayIntentBits } from "discord.js";

export const shopbotClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

export type ShopBotClient = typeof shopbotClient;
