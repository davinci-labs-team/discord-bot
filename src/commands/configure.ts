import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { UserCommand } from "../index.js";

const configureCommand: UserCommand = {
    data: new SlashCommandBuilder()
        .setName("configure")
        .setDescription("Configure the current guild to be ready for your hackaton"),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        await interaction.editReply({ content: "In dev !" });
    }
};

export default configureCommand;
