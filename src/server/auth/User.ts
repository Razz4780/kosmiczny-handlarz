export class User {
    public readonly name: string;
    public readonly uuid: string;

    constructor(name: string, uuid: string) {
        this.name = name;
        this.uuid = uuid;
    }
}
