import { TextChannel } from "discord.js";
import HackatonBotConfig from "../config/config.js";
import { HackatonBotClient } from "../utils/client.js";
import { supabase } from "../utils/supabase.js";

export default async function ListenToAnnounces() {
    supabase
        .channel("Announcement")
        .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "Announcement" },
            async (payload) => {
                const announce = payload.new;
                const channel = HackatonBotClient.guilds.cache
                    .get(HackatonBotConfig.GetConfig().GUILD_ID!)
                    ?.channels.cache.find((channel) => channel.name === "announcements");
                if (channel instanceof TextChannel) {
                    await channel.send({
                        content: `**New Announcement:**\n${announce.content}`
                    });
                } else {
                    console.error("Announces channel not found or is not a text channel.");
                }
            }
        )
        .subscribe((status) => {
            if (status === "SUBSCRIBED") {
                console.log("Successfully subscribed to announces channel.");
            } else {
                console.error("Failed to subscribe to announces channel.");
            }
        });
}
