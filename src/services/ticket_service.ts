import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    Colors,
    EmbedBuilder,
    Guild,
    MessageFlags,
    PermissionFlagsBits,
    TextChannel
} from "discord.js";
import { HackatonBotClient } from "../utils/client.js";
import { supabase } from "../utils/supabase.js";

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
    private static async GenerateTicketChannel(
        guild: Guild,
        discord_id: string
    ): Promise<TextChannel> {
        const channelOptions: any = {
            name: "Ticket-",
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: discord_id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                },
                {
                    id: HackatonBotClient.guilds.cache.get(guild.id)?.roles.everyone.id ?? "",
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: HackatonBotClient.user?.id,
                    allow: [
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.CreatePublicThreads,
                        PermissionFlagsBits.CreatePrivateThreads,
                        PermissionFlagsBits.SendTTSMessages,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.ManageMessages,
                        PermissionFlagsBits.ManageThreads,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.SendMessagesInThreads,
                        PermissionFlagsBits.ViewChannel
                    ]
                }
            ]
        };

        //get the ticket category parent
        const ticketCategory = guild.channels.cache.find(
            (c) => c.name === "tickets" && c.type === ChannelType.GuildCategory
        );
        if (!ticketCategory) {
            throw new Error("Ticket category not found");
        }
        channelOptions.parent = ticketCategory.id;

        //get last ticket id
        const lastTicket = await supabase
            .from("Ticket")
            .select("id")
            .eq("emitter_platform_id", "discord")
            .order("id", { ascending: false })
            .limit(1);
        if (lastTicket.error || !lastTicket.data) {
            throw new Error(`Failed to fetch last ticket: ${lastTicket.error.message}`);
        }
        let ticketId = 0;
        if (lastTicket.data.length) {
            ticketId = lastTicket.data[0]!.id + 1;
        }

        channelOptions.name += ticketId.toString(36).padStart(4, "0"); // Convert to base 36 and pad to 4 characters
        const ticketChannel = (await guild.channels.create(channelOptions)) as TextChannel;
        //insert the ticket into the database
        await supabase.from("Ticket").insert({
            id: ticketId,
            status: "OPEN",
            emitter_platform_id: "discord",
            channel_id: ticketChannel.id,
            user_discord_id: discord_id
        });

        return ticketChannel;
    }
    static async HandleTicketOpen(interaction: ButtonInteraction) {
        const channel = await this.GenerateTicketChannel(interaction.guild!, interaction.user.id);
        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle("Ticket Opened")
            .setDescription(
                `A private channel has been created for you, please wait for a staff member to join.
                Click here to view your ticket: <#${channel.id}>`
            )
            .setAuthor({
                name: "HackatonBot"
            });

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
}
