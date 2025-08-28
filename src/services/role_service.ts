import { CommandInteraction, PermissionFlagsBits, Role } from "discord.js";
import { Roles } from "../utils/constants.js";

export default abstract class RoleService {
    static async GenerateRoles(interaction: CommandInteraction): Promise<void> {
        //first we retreive the role names from the database
        const roles = ["ORGANIZER", "JURY", "MENTOR", "USER"];
        //now we create the roles in the guild
        const guild = interaction.guild;
        if (!guild) {
            throw new Error("This command can only be used in a server.");
        }
        const randomColor = Math.floor(Math.random() * 16777215).toString(16);
        const color = `#${randomColor}`;
        for (const role of roles) {
            try {
                const createdRole = await guild.roles.create({
                    name: role,
                    reason: "Role created by Hackaton Bot",
                    color: color as `#${string}`, // Ensure color is a valid hex code
                    mentionable: true
                });
                //now we give permissions to the role
                await this.GiveRolePermissions(role, createdRole);
            } catch (error) {
                console.error(`Failed to create role ${role}:`, error);
                throw new Error(`Failed to create role ${role}.`);
            }
        }
        const everyoneRole = guild.roles.cache.find((role) => role.name === "@everyone");
        await this.GiveRolePermissions(Roles.Everyone, everyoneRole!);
    }
    private static async GiveRolePermissions(role_name: string, role: Role) {
        let defaultDenyPermission: bigint[] = [];
        let defaultPermissions: bigint[] = [];
        switch (String(role_name)) {
            case "everyone":
                defaultDenyPermission = [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ViewChannel
                ];
                break;
            case Roles.User:
                defaultDenyPermission = [
                    PermissionFlagsBits.CreateEvents,
                    PermissionFlagsBits.MentionEveryone
                ];
                defaultPermissions = [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ViewChannel
                ];
                break;
            case Roles.Jury:
                defaultPermissions = [PermissionFlagsBits.Administrator];
                break;
            case Roles.Mentor:
                defaultPermissions = [PermissionFlagsBits.Administrator];
                break;
            case Roles.Organizer:
                defaultPermissions = [PermissionFlagsBits.Administrator];
                break;

            default:
                break;
        }

        //add the permissions to the role
        await role.setPermissions(role.permissions.remove(defaultDenyPermission!));

        await role.setPermissions(role.permissions.add(defaultPermissions!));
    }
}
