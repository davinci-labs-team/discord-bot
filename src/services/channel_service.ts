import {
    CategoryChannel,
    ChannelType,
    Guild,
    PermissionFlagsBits,
    Role,
    TextChannel
} from "discord.js";
import { InternalHackatonBotError, TeamChannelNotFound } from "../errors/internal_errors.js";
import { HackatonBotClient } from "../utils/client.js";
import TicketService from "./ticket_service.js";

export default abstract class ChannelService {
    private static async GenerateCategory(
        guild: Guild,
        defaultPermissions: bigint[],
        defaultDenyPermissions: bigint[],
        name: string
    ) {
        const everyoneRole = guild.roles.cache.find((role) => role.name === "@everyone");

        try {
            const permissionList = [
                {
                    id: HackatonBotClient.user?.id,
                    allow: [PermissionFlagsBits.Administrator]
                },
                {
                    id: everyoneRole,
                    allow: defaultPermissions,
                    deny: defaultDenyPermissions
                }
            ];
            const category = await guild.channels.create({
                name: name,
                type: ChannelType.GuildCategory,
                permissionOverwrites: permissionList.filter(
                    (permission) => permission.id !== undefined
                ) as any
            });
            return category;
        } catch (e) {
            throw new InternalHackatonBotError(
                "Could not generate Category: " + e,
                "HackatonBot couldn't generate the appropriate categories please check ifthe bot has the permission to do so."
            );
        }
    }
    private static async GenerateChannel(
        guild: Guild,
        category: CategoryChannel,
        name: string,
        allowPermissions: bigint[],
        denyPermissions: bigint[]
    ): Promise<TextChannel> {
        const everyoneRole = guild.roles.cache.find((role) => role.name === "@everyone");

        const channelOptions: any = {
            name: name,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: everyoneRole?.id,
                    allow: allowPermissions,
                    deny: denyPermissions
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
        return (await guild.channels.create(channelOptions)) as TextChannel;
    }
    static async GenerateGuildChannels(guild: Guild) {
        //first we generate the needed categories
        const defaultDenyPermissions = [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.CreatePublicThreads
        ];
        //information
        const informationCateory = await this.GenerateCategory(
            guild,
            [],
            defaultDenyPermissions,
            "information"
        );
        await this.GenerateChannel(
            guild,
            informationCateory,
            "announcements",
            [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.AddReactions],

            [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
        );

        //support
        const supportCategory = await this.GenerateCategory(
            guild,
            [],
            defaultDenyPermissions,
            "support"
        );
        await this.GenerateChannel(
            guild,
            supportCategory,
            "general-help",
            [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.AddReactions,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.SendMessages
            ],
            []
        );

        const ticketsCategory = await this.GenerateCategory(
            guild,
            [
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads
            ],
            defaultDenyPermissions,
            "tickets"
        );

        const ticketChan = await this.GenerateChannel(
            guild,
            ticketsCategory,
            "open-ticket",

            [PermissionFlagsBits.ViewChannel],
            [
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.CreatePublicThreads
            ]
        );
        await TicketService.GenerateTicketChannelMessage(ticketChan);

        const staffCategory = await this.GenerateCategory(
            guild,
            [
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads
            ],
            defaultDenyPermissions,
            "staff"
        );
        await this.GenerateChannel(
            guild,
            staffCategory,
            "staff-only",

            [],
            [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.CreatePublicThreads
            ]
        );
        const generalCateory = await this.GenerateCategory(
            guild,
            [
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.SendPolls,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.UseApplicationCommands
            ],
            [PermissionFlagsBits.MentionEveryone],
            "general"
        );
        //move general channel over to here
        const generalChannel = guild.channels.cache.find(
            (channel) => channel.name === "general" && channel.type === ChannelType.GuildText
        );
        if (generalChannel) {
            await generalChannel.edit({
                parent: generalCateory.id
            });
        }

        await this.GenerateCategory(
            guild,
            [
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.SendPolls,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.UseApplicationCommands
            ],
            [PermissionFlagsBits.MentionEveryone],
            "teams"
        );
    }

    public static async GenerateTeamsChannel(guild: Guild, teamRoles: Role[]) {
        //get the teams category
        const teamsCategory = guild.channels.cache.find(
            (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === "teams"
        ) as CategoryChannel | undefined;

        if (!teamsCategory) {
            console.error("Could not found the Teams Category");
            throw new TeamChannelNotFound();
        }
        for (const role of teamRoles) {
            try {
                const createdChannel = await this.GenerateChannel(
                    guild,
                    teamsCategory,
                    role.name,
                    [],
                    [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.CreatePrivateThreads,
                        PermissionFlagsBits.CreatePublicThreads
                    ]
                );
                await createdChannel.permissionOverwrites.create(role.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    AttachFiles: true,
                    CreatePrivateThreads: true,
                    CreatePublicThreads: true,
                    SendMessagesInThreads: true,
                    ReadMessageHistory: true
                });
            } catch (error) {
                console.error(
                    "Could not generate the team channel and/or add role to it: \n" + error
                );

                throw new Error("Could not generate the team channel and/or add role to it");
            }
        }
    }
}
