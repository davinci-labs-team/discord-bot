import { InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { InternalHackatonBotError } from "../errors/internal_errors.js";
import ChannelService from "../services/channel_service.js";
import RoleService from "../services/role_service.js";
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

        try {
            //now we try to generate the roles

            await RoleService.GenerateRoles(interaction);
            //now we generate the channels
            await ChannelService.GenerateGuildChannels(interaction.guild);
        } catch (error) {
            if (error instanceof InternalHackatonBotError) {
                console.error("Error generating roles:", error);
                await interaction.editReply({ content: error.message });
                return;
            }
            console.error("Unexpected error:", error);
            await interaction.editReply({ content: "An unexpected error occurred." });
            return;
        }

        await interaction.editReply({ content: "Done !" });
    }
};

export default configureCommand;
