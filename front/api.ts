import {IGameState} from "./game/IGame.js";

const AUTH = "/api/auth";
const GAMES = "/api/games";

export async function getGames(): Promise<{ uuid: string, name: string }[]> {
    const response = await fetch(GAMES);
    if (response.ok) {
        return await response.json();
    } else {
        throw new Error("An error occurred.");
    }
}

export async function getTopScores(): Promise<{ name: string, score: number, player: string }[]> {
    const response = await fetch(`${GAMES}/top`);
    if (response.ok) {
        return await response.json();
    } else {
        throw new Error("An error occurred");
    }
}

export async function sendScore(username: string, score: number, gameId: string): Promise<void> {
    const response = await fetch(`${GAMES}/${gameId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({username: username, score: score}),
    });
    if (!response.ok) {
        throw new Error("An error occurred");
    }
}

export async function getGameState(gameId: string): Promise<IGameState> {
    const response = await fetch(`${GAMES}/${gameId}`);
    if (response.ok) {
        return await response.json();
    } else {
        throw new Error("An error occurred.");
    }
}

export async function checkAuth(token: string): Promise<string | undefined> {
    const response = await fetch(`${AUTH}/check`, {
        headers: {
            "Authorization": token,
        },
        credentials: "same-origin",
    });
    if (response.ok) {
        const body = await response.json();
        return body.username;
    } else if (response.status === 401) {
        return undefined;
    } else {
        throw new Error("An error occurred.");
    }
}

export async function login(username: string, password: string):
    Promise<{ username: string, token: string } | undefined> {
    const response = await fetch(`${AUTH}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({username: username, password: password}),
    });
    if (response.ok) {
        const body = await response.json();
        return {username: body.username, token: body.token};
    } else if (response.status === 401) {
        return undefined;
    } else {
        throw new Error("An error occurred.");
    }
}

export async function register(username: string, password: string): Promise<string[]> {
    const response = await fetch(`${AUTH}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({username: username, password: password}),
    });
    if (response.ok) {
        return [];
    } else if (response.status === 403) {
        const body = await response.json();
        return body.errors;
    } else {
        throw new Error("An error occurred.");
    }
}

export async function uploadGame(token: string, name: string, file: File): Promise<string[]> {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("state", file);
    const response = await fetch(`${GAMES}/`, {
        method: "POST",
        headers: {
            "Authorization": token,
        },
        credentials: "same-origin",
        body: formData,
    });
    if (response.ok) {
        return [];
    } else if (response.status === 400) {
        const body = await response.json();
        return body.errors;
    } else {
        throw new Error("An error occurred.");
    }
}
