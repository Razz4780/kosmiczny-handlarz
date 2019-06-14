import {Planet} from "./Planet";
import {Starship} from "./Starship";

export class Game {
    constructor(public duration: number,
                public credits: number,
                public items: string[],
                public starships: Starship[],
                public planets: Planet[]) {
    }

    public check(): void {
        if (this.duration < 0) {
            throw new Error("Invalid game duration.");
        }
        if (this.credits < 0) {
            throw new Error("Invalid initial credits.");
        }
        this.checkItems();
        this.checkPlanets();
        this.checkStarships();
    }

    private checkItems(): void {
        let items = new Set<string>();
        this.items.forEach(item => {
            if (item.length < 1) {
                throw new Error("Item name cannot be empty.");
            }
            if (items.has(item)) {
                throw new Error(`Duplicate item ${item}.`);
            }
            items.add(item);
        });
    }

    private checkPlanets(): void {
        let names = new Set<string>();
        this.planets.forEach(planet => {
            if (names.has(planet.name)) {
                throw new Error(`Duplicate planet name ${planet.name}.`);
            }
            names.add(planet.name);
        });

    }

    private checkStarships(): void {
        let names = new Set<string>();
        this.starships.forEach(ship => {
            if (names.has(ship.name)) {
                throw new Error(`Duplicate starship name ${ship.name}`);
            }
            names.add(ship.name);
        });
    }
}
