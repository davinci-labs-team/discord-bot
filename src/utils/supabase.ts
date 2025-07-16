import { createClient } from "@supabase/supabase-js";
import HackatonBotConfig from "../config/config.js";

export const supabase = createClient(
    HackatonBotConfig.GetConfig().SUPABASE_HOST,
    HackatonBotConfig.GetConfig().SUPABSE_TOKEN
);
