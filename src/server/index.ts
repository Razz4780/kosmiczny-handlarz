import express from "express";

const app = express();

app.use(express.static("public"));

app.get("/api", (req, res) => {
    res.send("Hello World!");
});

app.listen(3000, () => {
    console.log("Server now running on port 3000.");
});
