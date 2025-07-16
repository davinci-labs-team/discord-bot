import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export interface UserCommand {
    execute: (
        interaction: ChatInputCommandInteraction & {
            options: import("discord.js").CommandInteractionOptionResolver;
        }
    ) => Promise<any>;
    data: SlashCommandBuilder;
}
