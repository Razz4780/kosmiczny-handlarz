import {Game} from "../Game.js";
import {Clock} from "./Clock.js";
import {ItemCounted} from "./ItemCounted.js";
import {NO_PLANET, Planet} from "./Planet.js";

export class Ship {
    public readonly name: string;
    public readonly cargoSize: number;
    public location: Planet;
    public items: ItemCounted[];
    private itemsCount: number;

    constructor(name: string, cargoSize: number, location: Planet) {
        this.name = name;
        this.cargoSize = cargoSize;
        this.location = location;
        this.items = [];
        this.itemsCount = 0;
    }

    public cargoFull(): boolean {
        return this.itemsCount === this.cargoSize;
    }

    public itemsInCargo(): number {
        return this.itemsCount;
    }

    public travelTo(dest: Planet, clock: Clock, game: Game): void {
        const distance = this.location.distanceTo(dest);
        if (distance > 0) {
            this.location = NO_PLANET;
            const ship = this;
            clock.addEvent(distance, {
                execute() {
                    ship.location = dest;
                    game.setShipLocation(ship, dest);
                },
            });
            game.setShipLocation(this, NO_PLANET);
        } else {
            game.setShipLocation(this, dest);
            this.location = dest;
        }
    }

    public buy(name: string): number {
        if (this.cargoFull()) {
            throw new Error("Cargo hold full");
        }
        const price = this.location.giveItem(name);
        let item = this.items.find((val) => val.name === name);
        if (item === undefined) {
            item = new ItemCounted(name, 1);
            this.items.push(item);
        } else {
            item.plusOne();
        }
        this.itemsCount += 1;
        return price;
    }

    public sell(name: string): number {
        const price = this.location.getItem(name);
        const index = this.items.findIndex((val) => val.name === name);
        if (index < 0) {
            throw new Error("No such item");
        }
        this.items[index].minusOne();
        this.itemsCount -= 1;
        if (this.items[index].getCount() === 0) {
            this.items.splice(index, 1);
        }
        return price;
    }
}
