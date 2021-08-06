export default class Handler<Config = unknown> {
    public readonly config: Config;

    constructor(config: Config) {
        this.config = Object.freeze(config);
    }
}
