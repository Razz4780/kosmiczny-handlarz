import {Request, RequestHandler} from "express";
import {User} from "./User";

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

    public getMiddleware(): RequestHandler {
        return (req, res, next) => {
            res.once("finish", () => {
                this.store.delete(req);
            });
            next();
        }
    }
}
