export default class Handler<Config = unknown> {
  public config: Config;

  constructor(config: Config) {
    this.config = config;
  }
}
