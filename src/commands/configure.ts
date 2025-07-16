import { InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { UserCommand } from "../types/internal.js";

const configureCommand: UserCommand = {
    data: new SlashCommandBuilder()
        .setName("configure")
        .setDescription("Configure the current guild to be ready for your hackaton")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        //check if the command is used in a guild
        if (!interaction.guild) {
            await interaction.editReply({ content: "This command can only be used in a server." });
            return;
        }
        //first wecheck that the user executing the command is an admin

        if (!interaction.memberPermissions?.has("Administrator")) {
            await interaction.editReply({
                content: "You need to be an admin to use this command."
            });
            return;
        }

        await interaction.editReply({ content: "In dev !" });
    }
};

export default configureCommand;
