import {Request, Response, NextFunction, RequestHandler} from "express";
import {Database} from "../Database";
import {UserStore} from "./UserStore";
import {User} from "./User";
import jsonWebToken from "jsonwebtoken";
import {IPayload} from "./IPayload";
import {UserNotFound} from "./UserNotFound";
import {compare, hash} from "bcrypt";
import uuid from "uuid/v4";
import {UserExists} from "./UserExists";
import express, {Router} from "express";

export class Auth {
    private readonly db: Database;
    private readonly store: UserStore;
    private readonly router: Router;
    private static readonly secret: string = process.env.SECRET || "secret";
    private static readonly expiration: number = 60 * 60 * 24 * 5;
    private static readonly algorithm: string = "HS256";
    private static readonly saltRounds: number = 10;

    constructor(db: Database, store: UserStore) {
        this.db = db;
        this.store = store;
        this.router = express.Router();
        this.router.post("/register", (req, res) => this.register(req, res));
        this.router.post("/login", (req, res) => this.login(req, res));
        this.router.get("/check", (req, res) => this.loginCheck(req, res));
    }

    public getRouter(): Router {
        return this.router;
    }

    private async register(req: Request, res: Response) {
        const username = req.body.username;
        const password = req.body.password;
        if (username === undefined || password === undefined) {
            res.status(400).json({error: "Invalid data."});
        } else {
            try {
                const user = await this.saveUser(username, password);
                res.status(201).json({uuid: user.uuid, name: user.name});
            } catch (err) {
                if (err instanceof UserExists) {
                    res.status(403).json({error: "User exists."});
                } else {
                    throw err;
                }
            }
        }
    }

    private async login(req: Request, res: Response) {
        const username = req.body.username;
        const password = req.body.password;
        if (username === undefined || password === undefined) {
            res.status(400).json({error: "Invalid data."});
        } else {
            try {
                const user = await this.authenticate(username, password);
                const token = Auth.createToken(user);
                res.cookie("Authorization", token);
                res.json({uuid: user.uuid, name: user.name});
            } catch (err) {
                if (err instanceof UserNotFound) {
                    res.status(401).end();
                } else {
                    throw err;
                }
            }
        }
    }

    private async loginCheck(req: Request, res: Response) {
        const user = this.store.get(req);
        if (user !== undefined) {
            res.json({uuid: user.uuid, name: user.name});
        } else {
            res.status(401).end();
        }
    }

    public getMiddleware(): RequestHandler {
        return async (req: Request, res: Response, next: NextFunction) => {
            const jwt = req.header("Authorization");
            if (jwt !== undefined) {
                try {
                    const user = Auth.getUser(jwt);
                    this.store.set(req, user);
                } catch (e) {
                    if (!(e instanceof jsonWebToken.JsonWebTokenError
                        || e instanceof jsonWebToken.TokenExpiredError)) {
                        throw e;
                    }
                }
            }
            next();
        };
    }

    private static getUser(jwt: string): User {
        const payload = jsonWebToken.verify(jwt, Auth.secret) as IPayload;
        return new User(payload.name, payload.uuid);
    }

    public static createToken(user: User): string {
        return jsonWebToken.sign({uuid: user.uuid}, Auth.secret, {
            algorithm: Auth.algorithm,
            expiresIn: Auth.expiration,
        });
    }

    public async authenticate(username: string, password: string): Promise<User> {
        const queryResults = await this.db.query({
            text: "SELECT uuid, hash FROM st_user WHERE name = $1",
            values: [username,],
        });
        if (queryResults.rowCount > 0
            && await compare(password, queryResults.rows[0].hash)) {
            return new User(username, queryResults.rows[0].uuid);
        }
        throw new UserNotFound();
    }

    public async saveUser(username: string, password: string): Promise<User> {
        const userId = uuid();
        const passHash = await hash(password, Auth.saltRounds);
        try {
            await this.db.query({
                text: "INSERT into st_user (name, uuid, hash) VALUES($1, $2, $3)",
                values: [username, userId, passHash],
            });
        } catch (err) {
            if (err.detail.indexOf("already exists")) {
                throw new UserExists();
            }
            throw err;
        }
        return new User(username, userId);
    }
}
