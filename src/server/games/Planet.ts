export class Planet {
    constructor(public name: string,
                public x: number,
                public y: number,
                public items: [string, number, number, number][]) {
    }

    public check(availableItems: string[]): void {
        if (this.name.length < 1) {
            throw new Error("Planet name cannot be empty.");
        }
        if (this.x < 0 || this.x > 100) {
            throw new Error(`Invalid coordinate ${this.x}.`);
        }
        if (this.y < 0 || this.y > 100) {
            throw new Error(`Invalid coordinate ${this.y}.`);
        }
        this.checkItems(availableItems);
    }

    private checkItems(availableItems: string[]): void {
        let names = new Set<string>();
        this.items.forEach(item => {
            if (item[0].length < 1) {
                throw new Error("Item name cannot be empty.");
            }
            if (availableItems.find(val => val === item[0]) === undefined) {
                throw new Error(`Unknown item ${item[0]}.`);
            }
            if (names.has(item[0])) {
                throw new Error("Duplicate item name.");
            }
            names.add(item[0]);
            if (item[1] < 0) {
                throw new Error(`Invalid available items count ${item[1]}.`);
            }
            if (item[2] < 0) {
                throw new Error(`Invalid item price ${item[2]}.`);
            }
            if (item[3] < 0) {
                throw new Error(`Invalid item price ${item[3]}.`);
            }
        });
    }
}
