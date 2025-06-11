import dotenv from "dotenv";

dotenv.config();
type Env = "development" | "production";

interface Config {
    DATABASE_HOST: string;
    DATABASE_PORT: number;
    DATABASE_USER: string;
    DATABASE_PASSWORD: string;
    DATABASE_NAME: string;
    ENV: Env;
    HACKATON_API_KEY: string;
    BOT_API_ENDPOINT: string;
    BOT_TOKEN: string;
}

export default class HackatonBotConfig {
    private static instance: HackatonBotConfig;
    private config: Config;

    private constructor() {
        this.config = {
            DATABASE_HOST: process.env.DATABASE_HOST as string,
            DATABASE_PORT: Number.parseInt(process.env.DATABASE_PORT as string),
            DATABASE_NAME: process.env.DATABASE_NAME as string,
            DATABASE_PASSWORD: process.env.DATABASE_PASSWORD as string,
            DATABASE_USER: process.env.DATABASE_USER as string,
            ENV: process.env.ENV as Env,
            BOT_API_ENDPOINT: process.env.BOT_API_ENDPOINT as string,
            BOT_TOKEN: process.env.BOT_TOKEN as string,
            HACKATON_API_KEY: process.env.DAVINCI_HACKATON_API_KEY as string
        };

        if (Object.values(this.config).some((o) => o === undefined || o === null)) {
            throw new Error("Some Envs are not set properly");
        }
        if (
            this.config.ENV === "production" &&
            this.config.BOT_API_ENDPOINT.includes("localhost")
        ) {
            throw new Error("Dev bot API endpoint detected !");
        }
    }

    static GetConfig(): Config {
        if (!this.instance) {
            HackatonBotConfig.instance = new HackatonBotConfig();
        }
        return this.instance.config;
    }
}
