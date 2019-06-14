export interface IGame {
    initial_credits: number,
    game_duration: number,
    items: string[],
    planets: {
        [planetName: string]: {
            x: number,
            y: number,
            available_items: {
                [itemName: string]: {
                    available: number,
                    buy_price: number,
                    sell_price: number,
                }
            },
        },
    },
    starships: {
        [starshipName: string]: {
            position: string,
            cargo_hold_size: number,
        },
    },
}
