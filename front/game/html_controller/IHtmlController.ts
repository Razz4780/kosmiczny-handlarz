import {Planet} from "../logic/Planet.js";
import {Ship} from "../logic/Ship.js";

export interface IHtmlController {
    setShipLocation(shipName: string, planetName: string): void;
    setRemainingTime(time: number): void;
    endGame(credits: number): void;
    setBalance(val: number): void;
    setItems(ship: Ship, credits: number): void;
    openShip(ship: Ship, credits: number, planets: Planet[]): void;
    openPlanet(planet: Planet, ships: Ship[]): void;
    updateShipModal(ship: Ship, credits: number, planets: Planet[]): void;
    updatePlanetModal(planet: Planet, ships: Ship[]): void;
    closeModal(): void;
    openStartModal(): void;
    setNick(): void;
    saveNickAndGame(): void;
}
