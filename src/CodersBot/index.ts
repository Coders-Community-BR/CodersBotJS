import { Client, ClientOptions, Message } from 'discord.js';

class CodersBot {
  constructor() { throw TypeError("Illegal Constructor"); }

  public static prefix: string;

  private static client: Client;
  private static once_ready: null | (() => void) = null;


  public static get onceReady(): (() => void) | null { return CodersBot.once_ready; }
  public static set onceReady(cb: (() => void) | null) { if (cb) CodersBot.once_ready = cb; }

  public static get Client() { return CodersBot.client; }
  public static on: Client['on'];
  public static once: Client['once'];
  public static login: Client['login'];
  public static onMessage: ((callback: ((message: Message) => void)) => void);

  public static init(botConfig?: ClientOptions | any /* Remove If Possible */, commandConfig?: any): void {
    CodersBot.prefix = commandConfig?.prefix ?? 'c?';

    const client = new Client(botConfig);

    if (CodersBot.once_ready) client.once('ready', CodersBot.once_ready);

    CodersBot.client = client;
    CodersBot.on = client.on.bind(client);
    CodersBot.once = client.once.bind(client);
    CodersBot.login = client.login.bind(client);
    CodersBot.onMessage = callback => client.on('message', callback);
  }
}

export default CodersBot;