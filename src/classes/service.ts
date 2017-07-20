export class Service {
    constructor(...params) { }
    public static factory(...params) { return new this(...params) }
}