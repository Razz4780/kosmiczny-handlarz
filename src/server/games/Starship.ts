import {Planet} from "./Planet"

export class Starship {
    constructor(public name: string,
                public position: string,
                public cargoSize: number) {
    }

    public check(availablePlanets: Planet[]): void {
        if (this.cargoSize < 0) {
            throw new Error(`${this.cargoSize} is not a valid cargo hold size.`);
        }
        if (this.name.length < 1) {
            throw new Error("Starship name cannot be empty.");
        }
        if (availablePlanets.find(val => val.name === this.position) === undefined) {
            throw new Error(`Unknown planet ${this.position}.`);
        }

    }
}
