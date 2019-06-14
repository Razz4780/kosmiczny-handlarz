export interface IGameState {
    game_duration: number;
    initial_credits: number;
    items: string[];
    planets: {
        [planetName: string]: {
            available_items: {
                [itemName: string]: {
                    available: number;
                    buy_price: number;
                    sell_price: number;
                },
            };
            x: number;
            y: number;
        },
    };
    starships: {
        [shipName: string]: {
            cargo_hold_size: number;
            position: string;
        },
    };
}
