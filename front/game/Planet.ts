import {ItemCountedPriced} from "./ItemCountedPriced.js";

export class Planet {
    public readonly name: string;
    public readonly locationX: number;
    public readonly locationY: number;
    public readonly items: ItemCountedPriced[];

    constructor(name: string,
                x: number,
                y: number,
                items: { name: string, count: number, sell: number, buy: number }[]) {
        this.name = name;
        this.locationX = x;
        this.locationY = y;
        this.items = items.map(item => {
            return new ItemCountedPriced(item.name, item.count, item.sell, item.buy);
        });
    }

    public distanceTo(other: Planet): number {
        return Math.ceil(
            Math.sqrt(
                Math.pow(this.locationX - other.locationX, 2)
                + Math.pow(this.locationY - other.locationY, 2),
            ),
        );
    }

    public sellMe(item: ItemCountedPriced): number {
        const myItem = this.items.find(val => val === item);
        if (myItem === undefined) {
            throw new Error(`No such item ${item.name}.`);
        }
        if (myItem.getCount() === 0) {
            throw new Error(`No ${item.name} available for trade.`)
        }
        myItem.minusOne();
        return myItem.priceBuy;
    }

    public buyFromMe(item: ItemCountedPriced): number {
        const myItem = this.items.find(val => val === item);
        if (myItem === undefined) {
            throw new Error(`No such item ${item.name}.`);
        }
        myItem.plusOne();
        return myItem.priceSell;
    }
}

export const NO_PLANET = new Planet("in travel", 0, 0, []);
