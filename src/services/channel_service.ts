import { ChannelType, Guild, PermissionFlagsBits } from "discord.js";
import { InternalHackatonBotError } from "../errors/internal_errors.js";
import { HackatonBotClient } from "../utils/client.js";

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
    private static async GenerateChannel(guild: Guild) {}
    static async GenerateGuildChannels(guild: Guild) {
        //first we generate the needed categories
        const defaultDenyPermissions = [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.CreatePublicThreads
        ];
        //information
        const informationCatory = await this.GenerateCategory(
            guild,
            [],
            defaultDenyPermissions,
            "information"
        );
        //support
        const supportCategory = await this.GenerateCategory(
            guild,
            [],
            defaultDenyPermissions,
            "support"
        );
        const ticketsCategory = await this.GenerateCategory(
            guild,
            [],
            defaultDenyPermissions,
            "tickets"
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

        //now we generate the channels inside the categories

        //annoncement
    }
}
