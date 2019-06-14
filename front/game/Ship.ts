import {ItemCounted} from "./ItemCounted.js";
import {Planet} from "./Planet.js";
import {ItemCountedPriced} from "./ItemCountedPriced";

export class Ship {
    public readonly name: string;
    public readonly cargoSize: number;
    private location: Planet;
    private items: ItemCounted[];

    constructor(name: string, cargoSize: number, location: Planet) {
        this.name = name;
        this.cargoSize = cargoSize;
        this.location = location;
        this.items = [];
    }

    public cargoFull(): boolean {
        return this.itemsInCargo() === this.cargoSize;
    }

    public itemsInCargo(): number {
        return this.items
            .map(item => item.getCount())
            .reduce((a, b) => a + b, 0);
    }

    public changeLocation(newLocation: Planet): void {
        this.location = newLocation;
    }

    public getLocation(): Planet {
        return this.location;
    }

    public buy(item: ItemCountedPriced): number {
        if (this.cargoFull()) {
            throw new Error("Cargo hold full");
        }
        const price = this.location.sellMe(item);
        let myItem = this.items.find(val => val.name === item.name);
        if (myItem === undefined) {
            myItem = new ItemCounted(item.name, 1);
            this.items.push(myItem);
        } else {
            myItem.plusOne();
        }
        return price;
    }

    public sell(item: ItemCountedPriced): number {
        const index = this.items.findIndex(val => val.name === item.name);
        if (index < 0) {
            throw new Error(`No such item ${item.name}.`);
        }
        const price = this.location.buyFromMe(item);
        this.items[index].minusOne();
        if (this.items[index].getCount() === 0) {
            this.items.splice(index, 1);
        }
        return price;
    }

    public getItems(): ItemCounted[] {
        return this.items;
    }
}
