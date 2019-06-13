import {CustomError} from "ts-custom-error";

export class UserNotFound extends CustomError {
    public constructor() {
        super();
    }
}
