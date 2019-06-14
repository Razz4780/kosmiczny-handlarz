import {ItemCounted} from "./ItemCounted.js";

export class ItemCountedPriced extends ItemCounted {
    public readonly priceSell: number;
    public readonly priceBuy: number;

    constructor(name: string, count: number, priceSell: number, priceBuy: number) {
        super(name, count);
        this.priceSell = priceSell;
        this.priceBuy = priceBuy;
    }
}
