export class InternalHackatonBotError extends Error {
    userFacingMessage: string;
    constructor(message: string, userFacingMessage: string) {
        super(message);
        this.userFacingMessage = userFacingMessage;
        Object.setPrototypeOf(this, InternalHackatonBotError.prototype);
    }
}

export class NoRoleFoundError extends InternalHackatonBotError {
    constructor() {
        super(
            "No roles found in the database.",
            "No roles found in the database. Please add roles first."
        );
    }
}

export class TeamChannelNotFound extends InternalHackatonBotError {
    constructor() {
        super(
            "Could not find 'teams' category",
            "The 'teams' category is missing. Run GenerateGuildChannels or create it manually."
        );
    }
}
