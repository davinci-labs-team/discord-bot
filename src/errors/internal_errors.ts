export class InternalHackatonBotError extends Error {
    userFacingMessage: string;
    constructor(message: string, userFacingMessage: string) {
        super(message);
        this.userFacingMessage = userFacingMessage;
        Object.setPrototypeOf(this, InternalHackatonBotError.prototype);
    }
}
