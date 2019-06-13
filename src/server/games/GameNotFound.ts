import {CustomError} from "ts-custom-error";

export class GameNotFound extends CustomError {
    public constructor() {
        super();
    }
}
