import { Client, ClientOptions, Message } from 'discord.js';
import Command from '~/commands/_base/Command';
import CommandPool from '~/commands/_base/CommandPool';
import LogHandler from '~/handlers/logs';
import { resolve } from '~/utils';

class CodersBot {
	public static get cwd() {
		return process.cwd();
	}

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
				logsDir,
			};
		} catch (e: unknown) {
			const msgError = `ERROR AT LOADING PATHS: ${e} - [${new Date().toISOString()}]`;
			CodersBot.ErrorLogger.WriteLine(msgError);
			console.error(msgError);
		}
	}

	public static async loadCommands() {
		try {
      this.commandPool = new CommandPool(CodersBot.paths.commandFilesDir);
      await this.commandPool.seed();
		} catch (e: unknown) {
			const msgError = `ERROR AT LOADING COMMAND POOL: ${e} - [${new Date().toISOString()}]`;
			CodersBot.ErrorLogger.WriteLine(msgError);
			console.error(msgError);
		}
	}

  public static TryRun(commandKey: string, message: Message, _args?: Array<string>) {
    const command = this.commandPool.get(commandKey);

    if(command) {
      command.Run(message)
    }
  }

	public static commandPool: CommandPool;

	public static paths: Record<
		'configDir' | 'srcDir' | 'commandFilesDir' | 'commandsDir' | 'logsDir',
		string
	>;
	public static ErrorLogger: LogHandler;
	public static prefix: string;

	private static client: Client;
	private static once_ready: null | (() => void) = null;

	public static get onceReady(): (() => void) | null {
		return CodersBot.once_ready;
	}
	public static set onceReady(cb: (() => void) | null) {
		if (cb) {
			CodersBot.once_ready = cb;
			if (CodersBot.client) CodersBot.client.once('ready', cb);
		}
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
