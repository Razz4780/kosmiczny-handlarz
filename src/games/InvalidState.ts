import {CustomError} from "ts-custom-error";

export class InvalidState extends CustomError {
    public constructor(public errors: string[]) {
        super();
    }
}
