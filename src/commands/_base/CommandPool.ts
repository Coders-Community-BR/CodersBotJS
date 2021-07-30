import { Dirent } from "fs";
import { opendir } from "fs/promises";
import CodersBot from "~/CodersBot";
import LogHandler from "~/handlers/logs";
import { resolve } from "~/utils";
import Command, { CommandOptions } from "./Command";

export default class CommandPool {
  private ErrorLogger: LogHandler;

  private _commands: Map<string, Command>;
  private _aliasMap: Map<string, string>;
  public path: string;

  constructor(path: string) {
    this.path = path;
    this.ErrorLogger = CodersBot.ErrorLogger;
    this._aliasMap = new Map();
    this._commands = new Map();
  }

  public async seed() {
    const dir = await opendir(this.path);

    let file: Dirent | null = await dir.read();
    while (file !== null) {
      if (file.isFile()) {
        const fName = file.name;

        const commandOpts = (await import(resolve(this.path, fName)))
          .default as CommandOptions;
        let command: Command;
        switch (commandOpts.Type) {
          default:
            command = new Command(commandOpts, CodersBot.Client);
        }

        this._commands.set(commandOpts.Name, command);

        if (commandOpts.Aliases) {
          for (const alias of commandOpts.Aliases) {
            this._aliasMap.set(alias, commandOpts.Name);
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
    let command = this._commands.get(key);

    if (!command) {
      const commandKey = this._aliasMap.get(key);

      if (!commandKey) return null;

      command = this._commands.get(commandKey);
    }

    return command ?? null;
  }
}
