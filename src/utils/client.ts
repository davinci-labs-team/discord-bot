import { Client, GatewayIntentBits } from "discord.js";

export const HackatonBotClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

export type HackatonBotClient = typeof HackatonBotClient;
