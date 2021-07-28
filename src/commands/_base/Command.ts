import { Client, Message, PermissionString } from 'discord.js';

export interface ExecuteCommandFunction {
  (client: Client, args: Array<string>, message: Message): void;
}

export interface CommandOptions {
  name: string;
  execute: ExecuteCommandFunction;
  permissions: Array<PermissionString>;  
}

export default class Command<Options extends CommandOptions = CommandOptions> {

  public readonly name: string;
  public readonly execute: ExecuteCommandFunction;



  constructor(options: Options) {
    const {
      name,
      execute
    } = options;
    this.name = name;
    this.execute = execute;
    
  }
}