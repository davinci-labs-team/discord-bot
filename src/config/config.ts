import dotenv from "dotenv";

dotenv.config();
type Env = "development" | "production";

interface Config {
    SUPABASE_HOST: string;
    SUPABSE_TOKEN: string;
    ENV: Env;
    BOT_TOKEN: string;
    DEV_SERVER_ID: string;
    CLIENT_ID: string;
    GUILD_ID: string;
}

export default class HackatonBotConfig {
    private static instance: HackatonBotConfig;
    private config: Config;

    private constructor() {
        this.config = {
            SUPABASE_HOST: process.env.SUPABASE_HOST as string,
            SUPABSE_TOKEN: process.env.SUPABASE_TOKEN as string,
            ENV: process.env.ENV as Env,
            BOT_TOKEN: process.env.BOT_TOKEN as string,
            DEV_SERVER_ID: process.env.DEV_SERVER_ID as string,
            CLIENT_ID: process.env.CLIENT_ID as string,
            GUILD_ID: process.env.GUILD_ID as string
        };

        if (Object.values(this.config).some((o) => o === undefined || o === null)) {
            throw new Error("Some Envs are not set properly");
        }
    }

    static GetConfig(): Config {
        if (!this.instance) {
            HackatonBotConfig.instance = new HackatonBotConfig();
        }
        return this.instance.config;
    }
}
