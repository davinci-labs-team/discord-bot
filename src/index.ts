import { Collection, Events, Interaction, REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";
import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ShopBotConfig from "./config/config.js";
import { InternalHackatonBotError } from "./errors/internal_errors.js";
import { DefaultHackatonBotMessages } from "./lang/default_messages.js";
import { HackatonBotClient } from "./utils/client.js";
import ListenToAnnounces from "./events/announces_listner.js";

interface CommandFile {
    execute: (interaction: Interaction) => void;
    data: SlashCommandBuilder;
}

const config = ShopBotConfig.GetConfig();
const commands = []; ///commands array
const clientCommands = new Collection<string, CommandFile>();

//getting all commands in the command folder

const filename = fileURLToPath(import.meta.url);
const dirNamevalue = dirname(filename);

const commandsPath = path.join(dirNamevalue, "commands");

let commandFiles: string[] = [];
if (config.ENV === "development") {
    commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));
} else {
    commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
}

//for each command file, require it and add it to the commands collection

for (const file of commandFiles) {
    try {
        //console.log(`Loading command ${i + 1}/${commandFiles.length}: ${file}`);
        const filePath = path.join(commandsPath, file!);
        const fileUrl = pathToFileURL(filePath).href;

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Import timeout")), 5000); // 5 second timeout
        });

        const commandModule = await Promise.race([await import(fileUrl), timeoutPromise]);

        const command = commandModule.default || commandModule;
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ("data" in command && "execute" in command) {
            clientCommands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            //console.log(`✓ Successfully loaded: ${command.data.name}`);
        } else {
            console.warn(
                `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    } catch (error) {
        console.error(`✗ Failed to load command ${file}:`, error);
        // Continue with the next command instead of stopping
        continue;
    }
}

//execute the interrecation
HackatonBotClient.on(Events.InteractionCreate, async (interaction) => {
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
        if (config.ENV === "development") {
            await rest.put(
                Routes.applicationGuildCommands(config.CLIENT_ID, config.DEV_SERVER_ID),
                { body: commands }
            );
        } else {
            //! Production Mode
            await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: commands });
        }

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
})();

await import("./utils/event_router.js");
await import("./events/announces_listner.js");

ListenToAnnounces();

HackatonBotClient.once("ready", () => {
    //client.user.setPresence({ activities: [{ name: 'Completing checkouts ....' }], status: 'online' }); //setting the bot activity
    console.log("Ready!");
});

//token
HackatonBotClient.login(config.BOT_TOKEN);
