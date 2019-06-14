import {Request} from "express";
import {User} from "./User";

/**
 * Instances of this class are meant to be used as a global mapping request -> user.
 */
export class UserStore {
    private readonly store: Map<Request, User>;

    constructor() {
        this.store = new Map<Request, User>();
    }

    public get(req: Request): User | undefined {
        return this.store.get(req);
    }

    public set(req: Request, user: User): void {
        this.store.set(req, user);
    }

    public remove(req: Request): void {
        this.store.delete(req);
    }
}
