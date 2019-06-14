import {IHtmlController} from "./html_controller/IHtmlController.js";
import {Clock} from "./logic/Clock.js";
import {Item} from "./logic/Item.js";
import {Planet} from "./logic/Planet.js";
import {Ship} from "./logic/Ship.js";

export class Game {
    public readonly controller: IHtmlController;
    private readonly clock: Clock;
    private readonly planets: Planet[];
    private readonly ships: Ship[];
    private readonly items: Item[];
    private credits: number;

    constructor(initialState: any, controller: IHtmlController) {
        this.controller = controller;
        this.clock = new Clock(initialState.game_duration, this);
        this.credits = initialState.initial_credits;
        this.items = [];
        initialState.items.forEach((val: string) => this.items.push(new Item(val)));
        this.planets = [];
        for (const planetName in initialState.planets) {
            if (initialState.planets.hasOwnProperty(planetName)) {
                const planet = initialState.planets[planetName];
                const itemsData: Array<[string, number, number, number]> = [];
                for (const itemName in planet.available_items) {
                    if (planet.available_items.hasOwnProperty(itemName)) {
                        const itemData = planet.available_items[itemName];
                        itemsData.push([
                            itemName,
                            itemData.available,
                            itemData.sell_price,
                            itemData.buy_price,
                        ]);
                    }
                }
                this.planets.push(new Planet(planetName, planet.x, planet.y, itemsData));
            }
        }
        this.ships = [];
        for (const shipName in initialState.starships) {
            if (initialState.starships.hasOwnProperty(shipName)) {
                const ship = initialState.starships[shipName];
                const cargoSize: number = ship.cargo_hold_size;
                const planet = this.planets.find((val) => val.name === ship.position);
                if (planet === undefined) {
                    throw new Error("No such planet");
                }
                this.ships.push(new Ship(shipName, cargoSize, planet));
            }
        }
    }

    public start(): void {
        this.controller.setBalance(this.credits);
        this.controller.setRemainingTime(this.clock.maxTime);
        this.controller.setNick();
        this.clock.start();
    }

    public buyItem(shipName: string, itemName: string): void {
        const ship = this.getShip(shipName);
        const amount = ship.buy(itemName);
        this.addToBalance(-amount);
        this.controller.openShip(ship, this.credits, this.planets);
    }

    public sellItem(shipName: string, itemName: string): void {
        const ship = this.getShip(shipName);
        const amount = ship.sell(itemName);
        this.addToBalance(amount);
        this.controller.openShip(ship, this.credits, this.planets)
    }

    public travel(shipName: string, planetName: string) {
        this.getShip(shipName).travelTo(this.getPlanet(planetName), this.clock, this);
    }

    public openShip(name: string): void {
        this.controller.openShip(this.getShip(name), this.credits, this.planets);
    }

    public openPlanet(name: string): void {
        this.controller.openPlanet(this.getPlanet(name), this.ships);
    }

    public setRemainingTime(val: number): void {
        this.controller.setRemainingTime(val);
    }

    public endGame(): void {
        this.controller.endGame(this.credits);
    }

    public setShipLocation(ship: Ship, planet: Planet): void {
        this.controller.updatePlanetModal(ship.location, this.ships);
        this.controller.setShipLocation(ship.name, planet.name);
        this.controller.updateShipModal(ship, this.credits, this.planets);
        this.controller.updatePlanetModal(planet, this.ships);
    }

    private getPlanet(name: string): Planet {
        const planet = this.planets.find((val) => val.name === name);
        if (planet === undefined) {
            throw new Error("No such planet");
        }
        return planet;
    }

    private getShip(name: string): Ship {
        const ship = this.ships.find((val) => val.name === name);
        if (ship === undefined) {
            throw new Error("No such ship");
        }
        return ship;
    }

    private addToBalance(value: number): void {
        this.credits += value;
        this.controller.setBalance(this.credits);
    }
}
