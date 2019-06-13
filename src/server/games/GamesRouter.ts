import express, {Response, Request, Router, RequestHandler} from "express";
import {Database} from "../Database";
import {UserStore} from "../auth/UserStore";
import multer from "multer";
import {GameNotFound} from "./GameNotFound";
import {InvalidState} from "./InvalidState";
import uuid from "uuid/v4";
import {Validator} from "jsonschema";

const GAME_STATE_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: {
        available_item: {
            type: "object",
            properties: {
                available: {type: "integer"},
                buy_price: {type: "integer"},
                sell_price: {type: "integer"},
            },
            additionalProperties: false,
        },
        planet: {
            type: "object",
            properties: {
                x: {type: "integer"},
                y: {type: "integer"},
                available_items: {
                    type: "object",
                    patternProperties: {
                        "*": {$ref: "#/definitions/available_item"}
                    },
                    additionalProperties: false,
                }
            },
            additionalProperties: false,
        },
        starship: {
            type: "object",
            properties: {
                position: {type: "string"},
                cargo_hold_size: {type: "integer"},
            },
            additionalProperties: false,
        },
    },
    type: "object",
    properties: {
        initial_credits: {type: "integer"},
        game_duration: {type: "integer"},
        items: {
            type: "array",
            items: {type: "string"},
        },
        planets: {
            type: "object",
            patternProperties: {
                "*": {$ref: "#/definitions/planet"}
            },
            additionalProperties: false,
        },
    },
    required: ["initial_credits", "game_duration", "items", "planets", "starships"],
    additionalProperties: false,
};

export class GamesRouter {
    private readonly router: Router;
    private readonly db: Database;
    private readonly store: UserStore;
    private readonly upload: multer.Instance;

    constructor(db: Database, store: UserStore) {
        this.db = db;
        this.store = store;
        this.upload = multer();
        this.router = express.Router();
        const stateUpload = this.upload.single("state");
        this.router.post("/", this.uploadGame(stateUpload));
        this.router.get("/", (req, res) => this.getGames(req, res));
        this.router.get("/top", (req, res) => this.getTopScores(req, res));
        this.router.get("/:gameId", (req, res) => this.getGameInitialState(req, res));
        this.router.post("/:gameId", (req, res) => this.uploadScore(req, res));
    }

    public getRouter(): Router {
        return this.router;
    }

    private async getGames(req: Request, res: Response) {
        const queryResults = await this.db.query({
            text: "SELECT uuid, name FROM st_game",
        });
        const games = queryResults.rows.map(row => {
            return {uuid: row.uuid, name: row.name}
        });
        res.json(games);
    }

    private async getTopScores(req: Request, res: Response) {
        const queryResults = await this.db.query({
            text: "SELECT name, best_player FROM st_game " +
                "WHERE max_score IS NOT NULL " +
                "ORDER BY max_score DESC " +
                "LIMIT 5",
        });
        const scores = queryResults.rows.map(row => {
            return {name: row.name, player: row.best_player};
        });
        res.json(scores);
    }

    private async getGameJson(uuid: string): Promise<string> {
        const queryResults = await this.db.query({
            text: "SELECT json FROM st_game WHERE uuid = $1",
            values: [uuid,],
        });
        if (queryResults.rowCount < 1) {
            throw new GameNotFound();
        }
        return queryResults.rows[0].json;
    }

    private async saveGameJson(state: string, name: string) {
        try {
            const stateJson = JSON.parse(state);
            GamesRouter.checkJson(stateJson);
        } catch (err) {
            if (err instanceof SyntaxError) {
                throw new InvalidState("Invalid json.");
            }
            throw err;
        }
        const gameId = uuid();
        await this.db.query({
            text: "INSERT INTO st_game (uuid, name, json, max_score, best_player) " +
                "VALUES($1, $2, $3, NULL, NULL)",
            values: [gameId, name, state,],
        });
    }

    private uploadGame(upload: RequestHandler): RequestHandler {
        return (req: Request, res: Response) => {
            const user = this.store.get(req);
            if (user === undefined) {
                res.status(401).end();
                return;
            }
            upload(req, res, async (err) => {
                const name = req.body.name;
                if (err || name === undefined) {
                    res.status(400).json({error: "Invalid data."});
                    return;
                }
                const stateString = req.file.buffer.toString();
                try {
                    await this.saveGameJson(stateString, name);
                } catch (err) {
                    if (err instanceof InvalidState) {
                        res.status(400).json({error: err.msg});
                        return;
                    }
                    throw err;
                }
                res.status(201);
            });
        }
    }

    private async getGameInitialState(req: Request, res: Response) {
        const gameId = req.params.gameId;
        const gameJson = await this.getGameJson(gameId);
        res.send(gameJson);
    }

    private async uploadScore(req: Request, res: Response) {
        const username = req.body.username;
        if (username === undefined) {
            res.status(400).json({error: "No username."});
            return;
        }
        const score = req.body.score;
        if (!Number.isInteger(score) || score < 0) {
            res.status(400).json({error: "Score is not a valid integer"});
            return;
        }
        const gameId = req.params.gameId;
        await this.db.query({
            text: "UPDATE st_game " +
                "SET max_score = CASE WHEN max_score < $1 THEN $1 ELSE max_score END, " +
                "best_player = CASE WHEN max_score < $1 THEN $2 ELSE best_player END " +
                "WHERE uuid = $3",
            values: [score, username, gameId,],
        });
        res.status(204).end();
    }

    private static checkJson(state: any) {
        const validator = new Validator();
        const validationResult = validator.validate(state, GAME_STATE_SCHEMA);
        if (!validationResult.valid) {
            throw new InvalidState("Invalid game state.");
        }
    }
}
