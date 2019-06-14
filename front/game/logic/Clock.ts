import {Game} from "../Game.js";
import {IGameEvent} from "./IGameEvent.js";

export class Clock {
    public readonly maxTime: number;
    private readonly events: Map<number, IGameEvent[]>;
    private readonly game: Game;
    private currentTime: number;

    constructor(maxTime: number, game: Game) {
        this.events = new Map<number, IGameEvent[]>();
        this.maxTime = maxTime;
        this.currentTime = 0;
        this.game = game;
    }

    public start(): void {
        this.nextStep();
    }

    public addEvent(time: number, event: IGameEvent): void {
        time = this.currentTime + time;
        let events = this.events.get(time);
        if (!events) {
            events = [];
            this.events.set(time, events);
        }
        events.push(event);
    }

    private nextStep(): void {
        setTimeout(() => {
            this.currentTime += 1;
            this.game.setRemainingTime(this.maxTime - this.currentTime);
            const events = this.events.get(this.currentTime);
            if (events) {
                events.forEach((event: IGameEvent) => {
                    event.execute();
                });
            }
            if (this.currentTime < this.maxTime) {
                this.nextStep();
            } else {
                this.game.endGame();
            }
        }, 1000);
    }
}
