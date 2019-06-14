import {ItemCountedPriced} from "./ItemCountedPriced.js";

export class Planet {
    public readonly name: string;
    public readonly locationX: number;
    public readonly locationY: number;
    public readonly items: ItemCountedPriced[];

    constructor(name: string, x: number, y: number, itemsData: Array<[string, number, number, number]>) {
        this.name = name;
        this.locationX = x;
        this.locationY = y;
        this.items = [];
        itemsData.forEach((val) => this.items.push(new ItemCountedPriced(val[0], val[1], val[2], val[3])));
    }

    public distanceTo(other: Planet): number {
        return Math.ceil(
            Math.sqrt(
                Math.pow(this.locationX - other.locationX, 2)
                + Math.pow(this.locationY - other.locationY, 2),
            ),
        );
    }

    public giveItem(name: string): number {
        const item = this.items.find((val) => val.name === name);
        if (item === undefined || item.getCount() === 0) {
            throw new Error("No such item");
        }
        item.minusOne();
        return item.priceBuy;
    }

    public getItem(name: string): number {
        const item = this.items.find((val) => val.name === name);
        if (item === undefined) {
            throw new Error("No such item");
        }
        item.plusOne();
        return item.priceSell;
    }
}

export const NO_PLANET = new Planet("w podróży", 0, 0, []);
