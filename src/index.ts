import express from "express";
import {Auth} from "./auth/Auth";
import {Database} from "./Database";
import {Games} from "./games/Games";

let dbUser = process.env.DBUSER || "postgres";
let dbName = process.env.DBNAME || "postgres";
let dbPass = process.env.DBPASS || "postgres";
let dbHost = process.env.DBHOST || "localhost";
let dbPort = process.env.DBPORT || "5432";

const db = new Database(dbUser, dbName, dbPass, dbHost, Number.parseInt(dbPort));
const auth = new Auth(db);
const games = new Games(db, auth.getStore());
db.prepareTables()
    .then(() => {
        const app = express();
        app.use(express.static("public"));
        app.use(express.json());
        app.use(express.urlencoded({extended: true}));
        app.use(auth.getMiddleware());
        app.use("/api/auth/", auth.getRouter());
        app.use("/api/games/", games.getRouter());

        const server = app.listen(3000, () => {
            console.log("Server now running on port 3000.");
        });

        process.on("SIGINT", () => {
            console.log("Server shutting down...");
            server.close();
            db.close()
                .then(() => {
                    console.log("Database connections closed.");
                })
                .catch(err => {
                    console.log("An error occured during database connections shutdown:");
                    console.log(err);
                    process.exit(1);
                });
        });

    })
    .catch(err => {
        console.log("An error occurred during database setup:");
        console.log(err);
        process.exit(1);
    });
