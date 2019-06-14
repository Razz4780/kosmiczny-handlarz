import {closeModal, getElement, setModalChild, setModalHtml} from "./common.js";
import {getGameState, sendScore} from "./api.js";
import {Game} from "./game/Game.js";
import {Ship} from "./game/Ship.js";
import {NO_PLANET, Planet} from "./game/Planet.js";
import {ItemCountedPriced} from "./game/ItemCountedPriced.js";

let game: Game;
// Currently open starship.
let currentShip: Ship | null = null;
// Currently open planet.
let currentPlanet: Planet | null = null;

function openPlanet(planet: Planet) {
    currentPlanet = planet;
    const itemsData = planet.items.map(item => {
        return `<tr><td>${item.name}</td><td>${item.getCount()}</td>`
            + `<td>${item.priceBuy}</td><td>${item.priceSell}</td></tr>`
    });
    const content = [
        `<section id="planet-modal"><h2>`,
        planet.name,
        `</h2><section class="table-section"><h3>Items</h3>`,
        `<table><thead><tr><th>Name</th><th>Count</th>`,
        `<th>Buy price</th><th>Sell price</th></tr></thead><tbody>`,
        itemsData.join("\n"),
        `</tbody></table></section><section><h3>Ships</h3><ul id="ships-in-modal"></ul>`,
        `</section></section>`,
    ].join("\n");
    setModalHtml(content);
    const shipsList = getElement("ships-in-modal");
    game.getShips()
        .filter(ship => ship.getLocation() === planet)
        .forEach(ship => {
            const newEl = document.createElement("li");
            newEl.innerText = ship.name;
            newEl.addEventListener("click", () => openShip(ship));
            shipsList.appendChild(newEl);
        });
}

function createCargoSection(ship: Ship): HTMLElement {
    console.log(ship);
    const section = document.createElement("section");
    section.id = "cargo";
    const header = document.createElement("h3");
    header.innerText = "Items";
    section.appendChild(header);
    if (ship.getItems().length) {
        const list = document.createElement("ul");
        ship.getItems().forEach(item => {
            const listEl = document.createElement("li");
            listEl.innerText = `${item.name} - ${item.getCount()}`;
            list.appendChild(listEl);
        });
        section.appendChild(list);
    } else {
        const noItemsInfo = document.createElement("p");
        noItemsInfo.innerText = "No items";
        section.appendChild(noItemsInfo);
    }
    return section;
}

function beginTravel(ship: Ship, planetName: string) {
    const positionInfo = getElement(`${ship.name}-position`);
    positionInfo.innerText = `(in travel)`;
    game.travel(ship, planetName, () => {
        positionInfo.innerText = `(${planetName})`;
        if (currentShip === ship) {
            openShip(ship);
        } else if (ship.getLocation() === currentPlanet) {
            openPlanet(currentPlanet);
        }
    });
}

function createTravelSection(ship: Ship): HTMLElement {
    const section = document.createElement("section");
    const header = document.createElement("h3");
    header.innerText = "Travel";
    section.appendChild(header);
    const destOptions = game.getPlanets()
        .filter(planet => planet !== ship.getLocation())
        .map(planet => {
            const option = document.createElement("option");
            option.value = planet.name;
            option.innerText = `${planet.name} (${ship.getLocation().distanceTo(planet)})`;
            return option;
        });
    if (destOptions.length) {
        const destSelect = document.createElement("select");
        destSelect.id = "destination-select";
        const dummyOption = document.createElement("option");
        dummyOption.value = "";
        dummyOption.innerText = "Pick destination";
        destSelect.appendChild(dummyOption);
        destOptions.forEach(opt => destSelect.appendChild(opt));
        destSelect.addEventListener("change", () => {
            beginTravel(ship, destSelect.value);
        });
        section.appendChild(destSelect);
    } else {
        const noDestInfo = document.createElement("p");
        noDestInfo.innerText = "No available destinations.";
        section.appendChild(noDestInfo);
    }
    return section;
}

function buyItem(ship: Ship, item: ItemCountedPriced) {
    game.buyItem(ship, item);
    getElement("balance").innerText = game.getBalance().toString();
    openShip(ship);
}

function sellItem(ship: Ship, item: ItemCountedPriced) {
    game.sellItem(ship, item);
    getElement("balance").innerText = game.getBalance().toString();
    openShip(ship);
}

function createTradeSection(ship: Ship): HTMLElement {
    console.log(ship);
    const section = document.createElement("section");
    section.classList.add("table-section");
    const header = document.createElement("h3");
    header.innerText = "Trade";
    section.appendChild(header);
    const table = document.createElement("table");
    section.appendChild(table);
    const thead = document.createElement("thead");
    table.appendChild(thead);
    const theadRow = document.createElement("tr");
    thead.appendChild(theadRow);
    ["Name", "Count", "Buy price", "Sell price", "Buy", "Sell"].forEach(head => {
        const th = document.createElement("th");
        th.innerText = head;
        theadRow.appendChild(th);
    });
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
    tbody.id = "trade-rows";
    const cargoFull = ship.cargoFull();
    const credits = game.getBalance();
    ship.getLocation().items.forEach(item => {
        const row = document.createElement("tr");
        tbody.appendChild(row);
        row.innerHTML =
            `<td>${item.name}</td>`
            + `<td id="${item.name}-count">${item.getCount()}</td>`
            + `<td>${item.priceBuy}</td>`
            + `<td>${item.priceSell}</td>`;
        const buyButton = document.createElement("button");
        buyButton.id = item.name + "-buy";
        buyButton.innerText = "+";
        buyButton.addEventListener("click", () => buyItem(ship, item));
        buyButton.disabled =
            cargoFull || item.getCount() === 0 || item.priceBuy > credits;
        let tdWrapper = document.createElement("td");
        tdWrapper.appendChild(buyButton);
        row.appendChild(tdWrapper);
        const sellButton = document.createElement("button");
        sellButton.id = item.name + "-sell";
        sellButton.innerText = "-";
        sellButton.addEventListener("click", () => sellItem(ship, item));
        const itemOnShip = ship.getItems().find(i => i.name === item.name);
        sellButton.disabled = itemOnShip === undefined;
        tdWrapper = document.createElement("td");
        tdWrapper.appendChild(sellButton);
        row.appendChild(tdWrapper);
    });
    return section;
}

function openShip(ship: Ship) {
    currentShip = ship;
    const section = document.createElement("section");
    section.id = "planet-modal";
    const header = document.createElement("h2");
    header.innerText = `${ship.name} (${ship.getLocation().name})`;
    section.appendChild(header);
    section.appendChild(createCargoSection(ship));
    if (ship.getLocation() !== NO_PLANET) {
        section.appendChild(createTravelSection(ship));
        section.appendChild(createTradeSection(ship));
    }
    setModalChild(section);
}

function setShips(ships: Ship[]) {
    const list = getElement("ships-list");
    ships.forEach(ship => {
        const listElement = document.createElement("li");
        listElement.innerHTML =
            `${ship.name} <span id="${ship.name}-position">(${ship.getLocation().name})</span>`;
        listElement.addEventListener("click", () => {
            openShip(ship);
        });
        list.appendChild(listElement);
    });
}

function setPlanets(planets: Planet[]) {
    const list = getElement("planets-list");
    planets.forEach((planet) => {
        const listElement = document.createElement("li");
        listElement.innerText = planet.name;
        listElement.addEventListener("click", () => {
            openPlanet(planet);
        });
        list.appendChild(listElement);
    });
}

const gameId = localStorage.getItem("gameId");
const nick = localStorage.getItem("nick");

if (gameId === null || nick === null) {
    alert("An unexpected error occurred.");
} else {
    localStorage.removeItem("gameId");
    localStorage.removeItem("nick");
    getElement("modal-exit").addEventListener("click", () => {
        closeModal();
        currentPlanet = null;
        currentShip = null;
    });
    getElement("player-nick").innerText = nick;
    const balance = getElement("balance");
    const remainingTime = getElement("remaining-time");

    getGameState(gameId)
        .then(gameState => {
            game = new Game(gameState);
            balance.innerText = game.getBalance().toString();
            remainingTime.innerText = game.remainingTime().toString();
            setShips(game.getShips());
            setPlanets(game.getPlanets());
            game.start(
                () => {
                    remainingTime.innerText = game.remainingTime().toString();
                },
                () => {
                    const score = game.getBalance();
                    sendScore(nick, score, gameId)
                        .then(() => {
                            setModalHtml(`Your final score is ${score}`);
                            getElement("modal-exit").addEventListener("click", () => {
                                window.location.replace("/");
                            });
                        })
                        .catch(alert)
                }
            )
        })
        .catch(alert);
}
