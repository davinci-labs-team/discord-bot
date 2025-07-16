import { CommandInteraction } from "discord.js";
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
                await guild.roles.create({
                    name: role.name,
                    reason: "Role created by Hackaton Bot",
                    color: color as `#${string}`, // Ensure color is a valid hex code
                    mentionable: true
                });
            } catch (error) {
                console.error(`Failed to create role ${role.name}:`, error);
                throw new Error(`Failed to create role ${role.name}.`);
            }
        }
    }
}
