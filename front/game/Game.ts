import {Clock} from "./Clock.js";
import {NO_PLANET, Planet} from "./Planet.js";
import {Ship} from "./Ship.js";
import {IGameState} from "./IGame.js";
import {ItemCountedPriced} from "./ItemCountedPriced.js";

export class Game {
    private readonly clock: Clock;
    private readonly planets: Planet[];
    private readonly ships: Ship[];
    private credits: number;

    constructor(initialState: IGameState) {
        this.clock = new Clock(initialState.game_duration);
        this.credits = initialState.initial_credits;
        this.planets = Object.entries(initialState.planets).map(pair => {
            const availableItems = Object.entries(pair[1].available_items).map(pair => {
                return {
                    name: pair[0],
                    count: pair[1].available,
                    sell: pair[1].sell_price,
                    buy: pair[1].buy_price
                }
            });
            return new Planet(pair[0], pair[1].x, pair[1].y, availableItems);
        });
        this.ships = Object.entries(initialState.starships).map(pair => {
            const planet = this.planets.find((val) => val.name === pair[1].position);
            if (planet === undefined) {
                throw new Error(`No such planet ${pair[1].position}`);
            }
            return new Ship(pair[0], pair[1].cargo_hold_size, planet);
        });
    }

    public start(onClockChange: () => void, onEnd: () => void): void {
        this.clock.start();
        this.clock.addOnChange(onClockChange);
        this.clock.addOnEnd(onEnd);
    }

    public buyItem(ship: Ship, item: ItemCountedPriced): void {
        this.credits -= ship.buy(item);
    }

    public sellItem(ship: Ship, item: ItemCountedPriced): void {
        this.credits += ship.sell(item);
    }

    public travel(ship: Ship, planetName: string, onFinish: () => void) {
        const planet = this.getPlanet(planetName);
        const location = ship.getLocation();
        if (location === NO_PLANET) {
            throw new Error(`Ship ${ship.getLocation()} already in travel.`);
        } else if (location !== planet) {
            const time = location.distanceTo(planet);
            this.clock.addOnTime(time, () => {
                ship.changeLocation(planet);
                onFinish();
            });
            ship.changeLocation(NO_PLANET);
        } else {
            onFinish();
        }
    }

    private getPlanet(name: string): Planet {
        const planet = this.planets.find((val) => val.name === name);
        if (planet === undefined) {
            throw new Error(`No such planet ${name}.`);
        }
        return planet;
    }

    public getBalance(): number {
        return this.credits;
    }

    public remainingTime(): number {
        return this.clock.maxTime - this.clock.getTime();
    }

    public getPlanets(): Planet[] {
        return this.planets;
    }

    public getShips(): Ship[] {
        return this.ships;
    }
}
