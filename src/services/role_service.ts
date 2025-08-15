import { CommandInteraction, Guild, PermissionFlagsBits, Role } from "discord.js";
import { supabase } from "../utils/supabase.js";
import { NoRoleFoundError } from "../errors/internal_errors.js";

export default abstract class RoleService {
    static async GenerateRoles(interaction: CommandInteraction): Promise<void> {
        //first we retreive the role names from the database
        const roles = await supabase
            .from("roles")
            .select("name")
            .order("priority", { ascending: true });
        if (roles.error) {
            console.error("Error fetching roles:", roles.error);
            throw new Error("Failed to fetch roles from the database.");
        }
        if (roles.data.length === 0) {
            throw new NoRoleFoundError();
        }

        //now we create the roles in the guild
        const guild = interaction.guild;
        if (!guild) {
            throw new Error("This command can only be used in a server.");
        }
        const randomColor = Math.floor(Math.random() * 16777215).toString(16);
        const color = `#${randomColor}`;
        for (const role of roles.data) {
            try {
                const createdRole = await guild.roles.create({
                    name: role.name,
                    reason: "Role created by Hackaton Bot",
                    color: color as `#${string}`, // Ensure color is a valid hex code
                    mentionable: true
                });
                //now we give permissions to the role
                await this.GiveRolePermissions(role.name, createdRole);
            } catch (error) {
                console.error(`Failed to create role ${role.name}:`, error);
                throw new Error(`Failed to create role ${role.name}.`);
            }
        }
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
            case "USER":
                defaultDenyPermission = [
                    PermissionFlagsBits.CreateEvents,
                    PermissionFlagsBits.MentionEveryone
                ];
                defaultPermissions = [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ViewChannel
                ];
                break;
            case "JURY":
                defaultPermissions = [PermissionFlagsBits.Administrator];
                break;
            case "MENTOR":
                defaultPermissions = [PermissionFlagsBits.Administrator];
                break;
            case "ORGANIZER":
                defaultPermissions = [PermissionFlagsBits.Administrator];
                break;

            default:
                break;
        }

        //add the permissions to the role
        for (let i = 0; i < defaultDenyPermission.length; i++) {
            role.permissions.remove(defaultDenyPermission[i]!);
        }
        for (let i = 0; i < defaultPermissions.length; i++) {
            role.permissions.add(defaultPermissions[i]!);
        }
    }
}
