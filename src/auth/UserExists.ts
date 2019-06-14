import {CustomError} from "ts-custom-error";

export class UserExists extends CustomError {
    public constructor() {
        super();
    }
}
