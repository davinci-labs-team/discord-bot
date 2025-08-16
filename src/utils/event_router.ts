import { Events } from "discord.js";
import { HackatonBotClient } from "./client.js";
import TicketService from "../services/ticket_service.js";

HackatonBotClient.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === "TIC-OPN") {
            //launching ticket open
            await TicketService.HandleTicketOpen(interaction);
        }
    }
});
