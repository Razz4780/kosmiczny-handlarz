import {Item} from "./Item.js";

export class ItemCounted extends Item {
    private count: number;

    constructor(name: string, count: number) {
        super(name);
        if (count < 0) {
            throw new Error("Negative count.")
        }
        this.count = count;
    }

    public plusOne(): void {
        this.count += 1;
    }

    public minusOne(): void {
        if (this.count < 1) {
            throw new Error("Negative count.");
        }
        this.count -= 1;
    }

    public getCount(): number {
        return this.count;
    }
}
