import {Game} from "./game/Game.js";
import {HtmlController} from "./game/html_controller/HtmlController.js";

export function initialize(initialState: any): Game {
    return new Game(initialState, new HtmlController());
}

export function controller(): HtmlController {
    return new HtmlController();
}
