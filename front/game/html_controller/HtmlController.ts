import {NO_PLANET, Planet} from "../logic/Planet.js";
import {Ship} from "../logic/Ship.js";
import {IHtmlController} from "./IHtmlController.js";
import {Game} from "../Game";

function alertError() {
    alert("Connection error.");
}

export class HtmlController implements IHtmlController {
    private static get(elementId: string): HTMLElement {
        const element = document.getElementById(elementId);
        if (element === null) {
            throw new Error("No such element: " + elementId);
        }
        return element;
    }

    private static setModal(content: string): void {
        HtmlController.get("modal-content").innerHTML = content;
        HtmlController.get("modal").style.display = "block";
    }

    private currentShip: Ship | null;
    private currentPlanet: Planet | null;
    private game: Game | null;

    constructor() {
        this.currentShip = null;
        this.currentPlanet = null;
        this.game = null;
    }

    public setGame(game: Game) {
        this.game = game;
    }

    public closeModal(): void {
        this.currentShip = null;
        this.currentPlanet = null;
        HtmlController.get("modal").style.display = "none";
    }

    public setShipLocation(shipName: string, planetName: string): void {
        HtmlController.get(`${shipName}-position`).innerText = `(${planetName})`;
    }

    public setRemainingTime(time: number): void {
        HtmlController.get("timer").innerText = time.toString();
    }

    public endGame(credits: number): void {
        const username = HtmlController.get("player-nick").innerText;
        const score = Number.parseInt(HtmlController.get("balance").innerText);
        const gameId = localStorage.getItem("gameId") as string;
        localStorage.removeItem("gameId");
        fetch(`/api/games/${gameId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify({username: username, score: score}),
        }).then(() => {
            alert("Successfully submitted your score!");
        }).catch((err) => {
            console.log(err);
            alert("Submitting your score failed.");
        }).finally(() => {
            const content = `Your final score is ${credits}!`;
            HtmlController.setModal(content);
            HtmlController.get("modal-exit").onclick = () => window.location.href = "/";
        });
    }

    public setBalance(val: number): void {
        HtmlController.get("balance").innerText = val.toString();
    }

    public setItems(ship: Ship, credits: number): void {
        ship.location.items.forEach((val) => {
            (HtmlController.get(`${val.name}-buy`) as HTMLButtonElement).disabled =
                ship.cargoFull() || val.getCount() === 0 || val.priceBuy > credits;
            const item = ship.items.find((it) => it.name === val.name);
            (HtmlController.get(`${val.name}-sell`) as HTMLButtonElement).disabled = item === undefined;
            HtmlController.get(`${val.name}-count`).innerText = val.getCount().toString();
        });
    }

    public openShip(ship: Ship, credits: number, planets: Planet[]): void {
        console.log(ship);
        this.currentShip = ship;
        const itemRows = ship.items.map(item => `<li>${item.name} - ${item.getCount()}</li>`);
        let content = [
            `<section id="planet-modal"><h2>`,
            ship.name,
            ` (`,
            ship.location.name,
            `)</h2><section id="cargo"><h3>Items</h3>`,
            itemRows.length > 0 ? `<ul>${itemRows.join("")}</ul>` : `<p>No items</p>`,
            `</section>`,
        ].join("");
        let tradeItems = null;
        if (ship.location !== NO_PLANET) {
            const destOptions: string[] = [];
            planets.forEach((val) => {
                if (val !== ship.location) {
                    destOptions.push(
                        `<option value="${val.name}">${val.name} (${ship.location.distanceTo(val)})</option>`,
                    );
                }
            });

            tradeItems = ship.location.items.map(item => {
                return `<tr>
<td>${item.name}</td>
<td id="${item.name}-count"></td>
<td>${item.priceBuy}</td>
<td>${item.priceSell}</td>
<td><button id="${item.name}-buy">+</button></td>
<td><button id="${item.name}-sell">-</button></td>
</tr>`
            });
            content += [
                `<section><h3>Podróż</h3>`,
                destOptions.length > 0
                    ? `<select id="destination-select">
<option value=""></option>${destOptions.join("")}</select></section>`
                    : `<p>No available destinations</p></section>`,
                `<section class="table-section"><h3>Trade</h3><table><thead><tr><th>Name</th><th>Count</th>
<th>Buy price</th>`,
                `<th>Sell price</th><th>Buy</th><th>Sell</th></tr></thead><tbody id="trade-rows">`,
                tradeItems.join(""),
                `</tbody></section></section>`,
            ].join("");
        } else {
            content += `</section>`;
        }
        HtmlController.setModal(content);
        if (ship.location !== NO_PLANET && planets.length > 1) {
            const destinationSelect = HtmlController.get("destionation-select") as HTMLSelectElement;
            destinationSelect.addEventListener("change", () => {
                (this.game as Game).travel(ship.name, destinationSelect.value);
            });
        }
        if (tradeItems !== null) {
            const tradeRows = HtmlController.get("trade-rows") as HTMLTableSectionElement;
            tradeRows.querySelectorAll("button").forEach(button => {
                if (button.innerText === "+") {
                    button.addEventListener("click", () => {
                        (this.game as Game).buyItem(ship.name, button.id.substring(0, button.id.length - 4));
                    });
                } else {
                    button.addEventListener("click", () => {
                        (this.game as Game).sellItem(ship.name, button.id.substring(0, button.id.length - 5));
                    });
                }
            });
        }
        this.setItems(ship, credits);
    }

    public openPlanet(planet: Planet, ships: Ship[]): void {
        this.currentPlanet = planet;
        const itemsRows = planet.items.map(
            item => `<tr><td>${item.name}</td><td>${item.getCount()}</td><td>${item.priceBuy}</td>
<td>${item.priceSell}</td></tr>`
        );
        const content = [
            `<section id="planet-modal"><h2>`,
            planet.name,
            `</h2><section class="table-section"><h3>Items</h3><table><thead><tr><th>Name</th><th>Count</th>
<th>Buy price</th><th>Sell price</th></tr></thead><tbody>`,
            itemsRows.join(""),
            `</tbody></table></section><section><h3>Ships</h3><ul id="ships-in-modal"></ul>`,
            `</section></section>`,
        ].join("");
        HtmlController.setModal(content);
        const shipsList = HtmlController.get("ships-in-modal") as HTMLUListElement;
        ships.filter(ship => ship.location === planet)
            .forEach(ship => {
                const newEl = document.createElement("li");
                newEl.innerText = ship.name;
                newEl.addEventListener("click", () => (this.game as Game).openShip(ship.name));
                shipsList.appendChild(newEl);
            });
    }

    public updateShipModal(ship: Ship, credits: number, planets: Planet[]): void {
        if (this.isShipPopupOpen(ship.name)) {
            this.openShip(ship, credits, planets);
        }
    }

    public updatePlanetModal(planet: Planet, ships: Ship[]): void {
        if (this.isPlanetPopupOpen(planet.name)) {
            this.openPlanet(planet, ships);
        }
    }

    public openStartModal(): void {
        fetch("/api/games").then(res => {
            if (res.status === 200) {
                res.json().then(data => {
                    const options = data.map((val: {
                        uuid: any;
                        name: any;
                    }) => `<option value="${val.uuid}">${val.name}</option>`);
                    HtmlController.setModal(`
<form action="./game.html">
<p>
<input type="text" placeholder="Your nick" id="nick-input" required/>
</p>
<p>
<select id="game-select">`
                        + options +
                        `</select>
</p>
<button type="submit" class="button" id="start-game-submit"">Rozpocznij grę</button>
</form>`);
                    HtmlController.get("start-game-submit")
                        .addEventListener("click", () => this.saveNickAndGame());
                }).catch(alertError);
            } else {
                alertError();
            }
        }).catch(alertError);
    }

    public saveNickAndGame(): void {
        console.log("Hello boi");
        const nick = (HtmlController.get("nick-input") as HTMLInputElement).value;
        localStorage.setItem("nick", nick);
        const gameSelect = HtmlController.get("game-select") as HTMLSelectElement;
        localStorage.setItem("gameId", gameSelect.options[gameSelect.selectedIndex].value);
        console.log(localStorage);
    }

    public setNick(): void {
        HtmlController.get("player-nick").innerText = localStorage.getItem("nick") || "---";
    }

    private isShipPopupOpen(name: string): boolean {
        return this.currentShip !== null && this.currentShip.name === name;
    }

    private isPlanetPopupOpen(name: string): boolean {
        return this.currentPlanet !== null && this.currentPlanet.name === name;
    }

    public checkLoggedIn() {
        const token = localStorage.getItem("token");
        if (token === null) {
            return;
        }
        fetch("/api/auth/check", {
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Authorization": token,
            }
        }).then((res) => {
            if (res.status === 200) {
                res.json().then(data => {
                    const username = data.name;
                    this.loggedIn(username);
                }).catch(alertError);
            } else if (res.status === 401) {
                localStorage.removeItem("userId");
            }
        }).catch(alertError);
    }

    public getTopScores() {
        fetch("/api/games/top")
            .then(res => {
                if (res.status === 200) {
                    res.json().then(data => {
                        const html = data.map(
                            (score: {
                                player: string;
                                score: number;
                                name: string;
                            }) => `<li>${score.player} - ${score.score} (${score.name})</li>`
                        );
                        HtmlController.get("top-scores-list").innerHTML = html.join("");
                    }).catch(alertError)
                }
            }).catch(alertError);
    }

    public login() {
        const username = HtmlController.get("login-input") as HTMLInputElement;
        const password = HtmlController.get("password-input") as HTMLInputElement;
        if (!username.value || !password.value) {
            return;
        }
        fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify({username: username.value, password: password.value}),
        }).then((res) => {
            if (res.status === 200) {
                username.value = "";
                password.value = "";
                res.json().then((data) => {
                    localStorage.setItem("token", data.token);
                    const username = data.name;
                    this.loggedIn(username);
                }).catch(alertError);
            } else if (res.status === 401) {
                alert("Invalid credentials provided.");
            }
        }).catch(alertError);
    }

    private createGame(nameInput: HTMLInputElement, fileInput: HTMLInputElement, event: Event) {
        event.preventDefault();
        const data = new FormData();
        data.append("name", nameInput.value);
        // @ts-ignore
        data.append("state", fileInput.files[0]);
        fetch("/api/games/", {
            method: "POST",
            body: data,
            credentials: "same-origin",
            headers: {
                "Authorization": localStorage.getItem("token") as string,
            },
        }).then(res => {
            if (res.status === 201) {
                alert("Game created!");
                window.location.reload();
            } else {
                res.json().then(data => {
                    alert(data.error);
                }).catch(alertError);
            }
        }).catch(alertError);
    }

    private loggedIn(username: string) {
        const section = HtmlController.get("auth-section");
        section.innerHTML = `<p>Hello ${username}!</p>`;
        const button = document.createElement("button");
        button.addEventListener("click", () => this.logout());
        button.innerText = "Logout";
        section.appendChild(button);
        const form = document.createElement("form");
        form.action = "#";
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.required = true;
        nameInput.placeholder = "Game name";
        form.appendChild(nameInput);
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.name = "state";
        fileInput.required = true;
        form.appendChild(fileInput);
        const submit = document.createElement("input");
        submit.type = "submit";
        submit.value = "Submit";
        form.addEventListener("submit", (event) => this.createGame(nameInput, fileInput, event));
        form.appendChild(submit);
        section.appendChild(form);
    }

    public logout() {
        localStorage.removeItem("token");
        window.location.reload();
    }

    public register() {
        const username = HtmlController.get("login-input") as HTMLInputElement;
        const password = HtmlController.get("password-input") as HTMLInputElement;
        if (!username.value || !password.value) {
            return;
        }
        fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify({username: username.value, password: password.value}),
        }).then((res) => {
            if (res.status === 201) {
                alert("You can now log in.");
                username.value = "";
                password.value = "";
            } else {
                res.json().then(data => {
                    alert(data.error);
                    username.value = "";
                    password.value = "";
                }).catch(alertError);
            }
        }).catch(alertError)
    }
}
