import { CommandInteraction, Guild, PermissionFlagsBits, Role } from "discord.js";
import { Roles } from "../utils/constants.js";
import { supabase } from "../utils/supabase.js";

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
    private static async AttributTeamRole(guild: Guild, role: Role, team_id: string) {
        const teamMembers = await supabase.from("User").select("discord").eq("teamId", team_id);
        if (teamMembers.error) {
            throw new Error("Could not fetch teams");
        }
        for (let i = 0; i < teamMembers.data.length; i++) {
            const discordId = teamMembers.data[i]?.discord;
            if (!discordId) continue;
            try {
                const member = await guild.members.fetch(String(discordId)).catch(() => null);
                if (!member) continue;
                await member.roles
                    .add(role)
                    .catch((err) => console.error(`Failed to add role to ${discordId}:`, err));
            } catch (err) {
                console.error(`Error assigning role to ${discordId}:`, err);
            }
        }
    }
    public static async GenerateAndAttributTeamRoles(guild: Guild): Promise<Role[]> {
        const teams = await supabase.from("Team").select("id, name");
        if (teams.error) {
            console.error("Failed to contact supabase GenerateTeamRoles: " + teams);
            throw new Error("Failed to contact supabase");
        }
        //generate the roles
        const generatedRoles = [];
        try {
            for (let i = 0; i < teams.data.length; i++) {
                const createdRole = await guild.roles.create({
                    name: teams.data[i]?.name,
                    reason: "Role created by Hackaton Bot",
                    //color: color as `#${string}`, // Ensure color is a valid hex code
                    mentionable: true
                });
                //now we give permissions to the role
                await this.AttributTeamRole(guild, createdRole, teams.data[i]?.id);
                generatedRoles.push(createdRole);
            }
        } catch (error) {
            console.error(`Failed to create team role :`, error);
            throw new Error(`Failed to create team role.`);
        }
        return generatedRoles;
    }
}
