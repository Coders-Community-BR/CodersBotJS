import { Dirent } from 'fs';
import { opendir } from 'fs/promises';
import CodersBot from '~/CodersBot';
import LogHandler from '~/handlers/logs';
import { resolve } from '~/utils';
import Command, { CommandOptions } from './Command';

export default class CommandPool {
  private ErrorLogger: LogHandler;

  private _commands: Map<string, Command>;
  public path: string;

  constructor(path: string) {
    this.path = path;
    this.ErrorLogger = CodersBot.ErrorLogger;
    this._commands = new Map();
  }

  public async seed() {
    const dir = await opendir(this.path);

    let file: Dirent | null = await dir.read();
    while (file !== null) {
      if (file.isFile()) {
        const fName = file.name;

        const commandOpts = (await import(resolve(this.path, fName))).default as CommandOptions;
        let command: Command;
        switch (commandOpts.Type) {
          default:
            command = new Command(commandOpts, CodersBot.Client);
        }

        if (this._commands.has(commandOpts.Name)) {
          console.error(`COMMAND NAME OVERLAPS: ${commandOpts.Name}`);
          process.exit(1);
        }

        this._commands.set(commandOpts.Name, command);

        if (commandOpts.Aliases) {
          for (const alias of commandOpts.Aliases) {
            if (this._commands.has(alias)) {
              console.error(`COMMAND ALIAS OVERLAPS: ${alias}`);
              process.exit(1);
            }

            this._commands.set(alias, command);
          }
        }
      }

      file = await dir.read();
    }

    await dir.close();
  }

  /**
   * Update Later
   * @param key Name or Alias
   */
  public get(key: string) {
    return this._commands.get(key) ?? null;
  }

  public toArray(limit?: number) {
    const arrayLimit = limit && limit < this._commands.size ? limit : this._commands.size;
    const commandArray = new Array<Command>(arrayLimit);

    const cmdIterator = this._commands.values();

    for (let i = 0; i < arrayLimit; i++) {
      const result = cmdIterator.next();

      if (result.done) break;

      commandArray[i] = result.value;
    }

    return commandArray;
  }

  public Select<Tresult>(callback: (command: Command) => Tresult, limit?: number) {
    const arrayLimit = limit && limit < this._commands.size ? limit : this._commands.size;
    const commandArray = new Array<Tresult>(arrayLimit);

    const cmdIterator = this._commands.values();

    for (let i = 0; i < arrayLimit; i++) {
      const result = cmdIterator.next();

      if (result.done) break;

      commandArray[i] = callback(result.value);
    }

    return commandArray;
  }
}
