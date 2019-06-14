export class Clock {
    public readonly maxTime: number;
    private readonly onTime: Map<number, (() => void)[]>;
    private onEnd: (() => void) | undefined;
    private onChange: (() => void) | undefined;
    private currentTime: number;

    constructor(maxTime: number) {
        this.onTime = new Map<number, (() => void)[]>();
        this.maxTime = maxTime;
        this.currentTime = 0;
        this.onEnd = undefined;
        this.onChange = undefined;
    }

    public start(): void {
        this.nextStep();
    }

    public getTime(): number {
        return this.currentTime;
    }

    public addOnTime(time: number, callback: () => void): void {
        time = this.currentTime + time;
        let events = this.onTime.get(time);
        if (!events) {
            events = [];
            this.onTime.set(time, events);
        }
        events.push(callback);
    }

    public addOnEnd(callback: () => void) {
        this.onEnd = callback;
    }

    public addOnChange(callback: () => void) {
        this.onChange = callback;
    }

    private nextStep(): void {
        setTimeout(() => {
            this.currentTime += 1;
            if (this.onChange !== undefined) {
                this.onChange();
            }
            const events = this.onTime.get(this.currentTime);
            if (events) {
                events.forEach((event) => {
                    event();
                });
            }
            if (this.currentTime < this.maxTime) {
                this.nextStep();
            } else if (this.onEnd !== undefined) {
                this.onEnd();
            }
        }, 1000);
    }
}
