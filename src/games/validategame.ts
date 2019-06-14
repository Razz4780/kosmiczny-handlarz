import {InvalidState} from "./InvalidState";
import {validate} from "jsonschema";
import {IGame} from "./IGame";

const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: {
        available_item: {
            type: "object",
            properties: {
                available: {type: "integer", minLength: "1"},
                buy_price: {type: "integer", minimum: 0},
                sell_price: {type: "integer", minimum: 0},
            },
            required: ["available", "buy_price", "sell_price"],
            additionalProperties: false,
        },
        planet: {
            type: "object",
            properties: {
                x: {type: "integer", minium: 0, maximum: 100},
                y: {type: "integer", minimum: 0, maximum: 100},
                available_items: {
                    type: "object",
                    additionalProperties: {$ref: "#/definitions/available_item"},
                }
            },
            required: ["x", "y", "available_items"],
            additionalProperties: false,
        },
        starship: {
            type: "object",
            properties: {
                position: {type: "string", minLength: 1},
                cargo_hold_size: {type: "integer", minimum: 0},
            },
            required: ["position", "cargo_hold_size"],
            additionalProperties: false,
        },
    },
    type: "object",
    properties: {
        initial_credits: {type: "integer", minimum: 0},
        game_duration: {type: "integer", minimum: 1},
        items: {
            type: "array",
            items: {type: "string", minLength: 1},
            maxItems: 20,
        },
        planets: {
            type: "object",
            additionalProperties: {$ref: "#/definitions/planet"},
        },
        starships: {
            type: "object",
            additionalProperties: {$ref: "#/definitions/starship"},
        },
    },
    required: ["initial_credits", "game_duration", "items", "planets", "starships"],
    additionalProperties: false,
};


export function validateGame(jsonString: string) {
    try {
        const game = JSON.parse(jsonString) as IGame;
        const validationResult = validate(game, schema);
        if (!validationResult.valid) {
            const errors = validationResult.errors.map(err => err.toString());
            throw new InvalidState(errors);
        }
        const items = new Set<string>();
        game.items.forEach((item) => {
            if (items.has(item)) {
                throw new InvalidState([`Duplicate item ${item}.`]);
            }
            items.add(item);
        });
        const planets = new Set<string>();
        Object.keys(game.planets).forEach(name => planets.add(name));
        Object.values(game.starships).forEach(ship => {
            if (!planets.has(ship.position)) {
                throw new InvalidState([`No such planet ${ship.position}.`]);
            }
        });
        const takenPositions = new Set<number>();
        Object.values(game.planets).forEach(planet => {
            const position = planet.x * 1000 + planet.y;
            if (takenPositions.has(position)) {
                throw new InvalidState(["Two planets cannot occupy the same slot."])
            }
            takenPositions.add(position);
            Object.keys(planet.available_items).forEach(name => {
                if (!items.has(name)) {
                    throw new InvalidState([`No such item ${name}.`]);
                }
            });
        });
    } catch (err) {
        if (err instanceof SyntaxError) {
            throw new InvalidState(["Invalid JSON."]);
        }
        throw err;
    }
}
