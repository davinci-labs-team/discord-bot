import { InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { UserCommand } from "../types/internal.js";

const teamsAutoRoles: UserCommand = {
    data: new SlashCommandBuilder()
        .setName("team_autorole")
        .setDescription("Launch the team's role auto attribution and channel creation")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        await interaction.reply({ content: "In Dev", flags: MessageFlags.Ephemeral });
    }
};

export default teamsAutoRoles;
