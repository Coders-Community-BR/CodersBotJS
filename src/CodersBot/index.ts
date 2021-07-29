import { Client, ClientOptions, Message } from 'discord.js';
import { resolve } from '~/utils';

class CodersBot {
  public static get cwd() { return process.cwd(); } 

	public static loadPaths() {
    try {
      const configDir = resolve('config');
      const srcDir = resolve('src');
      const commandsDir = resolve('src/commands');
      const commandFilesDir = resolve('src/commands/files');
      const logsDir = resolve('logs');

      CodersBot.paths = {
        configDir,
        srcDir,
        commandFilesDir,
        commandsDir,
        logsDir
      };

    } catch (e) { console.error(`ERROR AT LOADING PATHS: %o - [${new Date().toISOString()}]`, e)}
  }

	public static paths: Record<string, string>;

	public static prefix: string;

	private static client: Client;
	private static once_ready: null | (() => void) = null;

	public static get onceReady(): (() => void) | null {
		return CodersBot.once_ready;
	}
	public static set onceReady(cb: (() => void) | null) {
		if (cb) CodersBot.once_ready = cb;
	}

	public static get Client() {
		return CodersBot.client;
	}
	public static on: Client['on'];
	public static once: Client['once'];
	public static login: Client['login'];
	public static onMessage: (callback: (message: Message) => void) => void;

	public static init(
		botConfig?: ClientOptions | any /* Remove If Possible */,
		commandConfig?: any
	): void {
		CodersBot.prefix = commandConfig?.prefix ?? 'c?';

		const client = new Client(botConfig);

		if (CodersBot.once_ready) client.once('ready', CodersBot.once_ready);

		CodersBot.client = client;
		CodersBot.on = client.on.bind(client);
		CodersBot.once = client.once.bind(client);
		CodersBot.login = client.login.bind(client);
		CodersBot.onMessage = (callback) => client.on('message', callback);
	}

	constructor() {
		throw TypeError('Illegal Constructor');
	}
}

export default CodersBot;