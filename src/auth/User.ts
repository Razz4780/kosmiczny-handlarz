import {IPayload} from "./IPayload";

export class User {
    public readonly username: string;
    public readonly uuid: string;

    constructor(username: string, uuid: string) {
        this.username = username;
        this.uuid = uuid;
    }

    public getPayload(): IPayload {
        return {
            uuid: this.uuid,
            username: this.username,
        }
    }
}
