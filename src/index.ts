import {
    ChatInputCommandInteraction,
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    Interaction,
    REST,
    Routes,
    SlashCommandBuilder
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import HackatonBotConfig from "./config/config";
import { InternalHackatonBotError } from "./errors/internal_errors";
import { DefaultHackatonBotMessages } from "./lang/default_messages";

export const hackatonClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

interface CommandFile {
    execute: (interaction: Interaction) => void;
    data: SlashCommandBuilder;
}

export interface UserCommand {
    execute: (
        interaction: ChatInputCommandInteraction & {
            options: import("discord.js").CommandInteractionOptionResolver;
        }
    ) => Promise<any>;
    data: SlashCommandBuilder;
}

const config = HackatonBotConfig.GetConfig();
const commands = []; ///commands array
const clientCommands = new Collection<string, CommandFile>();

//getting all commands in the command folder
// eslint-disable-next-line unicorn/prefer-module
const commandsPath = path.join(__dirname, "commands");

const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));

//for each command file, require it and add it to the commands collection
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    // eslint-disable-next-line unicorn/prefer-module
    const commandModule = require(filePath);
    const command = commandModule.default || commandModule;
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
        clientCommands.set(command.data.name, command);
    } else {
        console.log(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
    }
    //set the command in the array to be able to register it

    commands.push(command.data.toJSON());
}

//execute the interrecation
hackatonClient.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;
    const command = clientCommands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        if (error instanceof InternalHackatonBotError) {
            await interaction.editReply({ content: error.userFacingMessage });
            return;
        }
        console.error(command.data.name + " command catched error: \n" + error);
        await interaction.editReply({ content: DefaultHackatonBotMessages.InternalError });
        return;
    }
});

const rest = new REST().setToken(config.BOT_TOKEN);
//log every slash commands
(async () => {
    try {
        console.log("Started refreshing application (/) commands.");
        console.log(config.DEV_SERVER_ID);

        if (config.ENV === "development") {
            await rest.put(Routes.applicationGuildCommands(config.APP_ID, config.DEV_SERVER_ID), {
                body: commands
            });
        } else {
            //! Production Mode
            await rest.put(Routes.applicationCommands(config.APP_ID), { body: commands });
        }

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
})();

hackatonClient.once("ready", () => {
    console.log("Ready!");
});

//token
hackatonClient.login(config.BOT_TOKEN);
