import express, {Response, Request, Router} from "express";
import {Database} from "../Database";
import {UserStore} from "../auth/UserStore";
import multer from "multer";
import {GameNotFound} from "./GameNotFound";
import {InvalidState} from "./InvalidState";
import uuid from "uuid/v4";
import {validate} from "jsonschema";
import {validateGame} from "./validategame";
import {RequestValidator} from "../validation/RequestValidator";

export class Games {
    private readonly router: Router;
    private readonly db: Database;
    private readonly store: UserStore;

    constructor(db: Database, store: UserStore) {
        this.db = db;
        this.store = store;
        this.router = express.Router();

        this.router.post("/", (req, res) => this.uploadGame(req, res));
        this.router.get("/", (req, res) => this.getGames(req, res));
        this.router.get("/top", (req, res) => this.getTopScores(req, res));
        this.router.get("/:gameId", (req, res) => this.getGameInitialState(req, res));

        const scoreMiddleware = new RequestValidator({
            type: "object",
            properties: {
                username: {type: "string", minLength: 1},
                score: {type: "number", minimum: 0},
            },
            required: ["username", "score"],
            additionalProperties: false,
        }).getMiddleware();
        this.router.post(
            "/:gameId",
            scoreMiddleware,
            (req, res) => this.uploadScore(req, res)
        );
    }

    public getRouter(): Router {
        return this.router;
    }

    private async getGames(req: Request, res: Response) {
        try {
            const queryResults = await this.db.query({
                text: "SELECT uuid, name FROM st_game",
            });
            const games = queryResults.rows.map(row => {
                return {uuid: row.uuid, name: row.name}
            });
            res.json(games);
        } catch (err) {
            res.status(500).end();
        }
    }

    private async getTopScores(req: Request, res: Response) {
        try {
            const queryResults = await this.db.query({
                text: "SELECT max_score, best_player, name FROM st_game " +
                    "WHERE max_score IS NOT NULL " +
                    "ORDER BY max_score DESC " +
                    "LIMIT 5",
            });
            const scores = queryResults.rows.map(row => {
                return {name: row.name, player: row.best_player, score: row.max_score};
            });
            res.json(scores);
        } catch (err) {
            res.status(500).end();
        }
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
        validateGame(state);
        const gameId = uuid();
        await this.db.query({
            text: "INSERT INTO st_game (uuid, name, json, max_score, best_player) " +
                "VALUES($1, $2, $3, NULL, NULL)",
            values: [gameId, name, state,],
        });
    }

    private uploadGame(req: Request, res: Response) {
        const user = this.store.get(req);
        if (user === undefined) {
            res.status(401).end();
            return;
        }
        const upload = multer().single("state");
        upload(req, res, async (err) => {
            const name = req.body.name;
            const validationResult = validate(name, {type: "string", minLength: 1});
            if (!validationResult.valid) {
                const errors = validationResult.errors.map(err => err.toString());
                res.status(400).json({errors: errors});
                return;
            }
            if (err) {
                res.status(400).json(
                    {errors: ["An error occurred during file processing."]}
                );
                return;
            }
            const stateString = req.file.buffer.toString();
            try {
                await this.saveGameJson(stateString, name);
            } catch (err) {
                if (err instanceof InvalidState) {
                    res.status(400).json({errors: err.errors});
                    return;
                } else {
                    res.status(500).end();
                    return;
                }
            }
            res.status(201).end();
        });
    }

    private async getGameInitialState(req: Request, res: Response) {
        try {
            const gameId = req.params.gameId;
            const gameJson = await this.getGameJson(gameId);
            res.send(gameJson);
        } catch (err) {
            if (err instanceof GameNotFound) {
                res.status(404).end();
            } else {
                res.status(500).end();
            }
        }
    }

    private async uploadScore(req: Request, res: Response) {
        const username = req.body.username;
        const score = req.body.score;
        const gameId = req.params.gameId;
        await this.db.query({
            text: "UPDATE st_game " +
                "SET max_score = CASE WHEN max_score IS NULL OR max_score < $1 THEN $1 ELSE max_score END, " +
                "best_player = CASE WHEN max_score IS NULL OR max_score < $1 THEN $2 ELSE best_player END " +
                "WHERE uuid = $3",
            values: [score, username, gameId,],
        });
        res.status(204).end();
    }
}
