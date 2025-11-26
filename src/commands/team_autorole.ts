import { InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { UserCommand } from "../types/internal.js";
import RoleService from "../services/role_service.js";
import { InternalHackatonBotError } from "../errors/internal_errors.js";
import ChannelService from "../services/channel_service.js";

const teamsAutoRoles: UserCommand = {
    data: new SlashCommandBuilder()
        .setName("team_autorole")
        .setDescription("Launch the team's role auto attribution and channel creation")
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
            const roles = await RoleService.GenerateAndAttributTeamRoles(interaction.guild);
            //now we generate the teams channels
            await ChannelService.GenerateTeamsChannel(interaction.guild, roles);
        } catch (error) {
            let errorMessage = "An error occured please check the logs";
            if (error instanceof InternalHackatonBotError) {
                errorMessage = error.message;
            }
            await interaction.editReply({
                content: errorMessage
            });
            return;
        }

        await interaction.editReply({
            content: "Team roles and Channels generated !"
        });
    }
};

export default teamsAutoRoles;
