import express from "express";
import {Auth} from "./auth/Auth";
import {Database} from "./Database";
import {UserStore} from "./auth/UserStore";
import {GamesRouter} from "./games/GamesRouter";

let dbUser = process.env.DBUSER || "postgres";
let dbName = process.env.DBNAME || "postgres";
let dbPass = process.env.DBPASS || "postgres";
let dbHost = process.env.DBHOST || "localhost";
let dbPort = process.env.DBPORT || "2137";

const db = new Database(dbUser, dbName, dbPass, dbHost, Number.parseInt(dbPort));
const currentUser = new UserStore();
const auth = new Auth(db, currentUser);

const app = express();
app.use(currentUser.getMiddleware());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded());
app.use(auth.getMiddleware());
app.use("/api/auth/", auth.getRouter());
app.use("/api/games/", new GamesRouter(db, currentUser).getRouter());

const server = app.listen(3000, () => {
    console.log("Server now running on port 3000.");
});

process.on("SIGINT", () => {
    console.log("Server shutting down...");
    server.close();
    db.close();
});
