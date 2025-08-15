import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    TextChannel
} from "discord.js";

export default abstract class TicketService {
    static async GenerateTicketChannelMessage(channel: TextChannel) {
        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle("Contact Staff")
            .setAuthor({
                name: "HackatonBot"
            })
            .setDescription(
                `You may directly contact support by clicking on the button bellow, this will create a private channel.`
            );
        const openTicketButton = new ButtonBuilder()
            .setCustomId("TIC-OPN")
            .setEmoji({ name: "🎟️" })
            .setStyle(ButtonStyle.Primary)
            .setLabel("Open Ticket");

        await channel.send({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(openTicketButton).toJSON()]
        });
    }
}
