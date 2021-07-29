import { Client, Message, PermissionString, Snowflake } from 'discord.js';

export interface ExecuteCommandFunction<I extends ICommand = ICommand> {
	(client: Client, args: Array<string>, message: Message, command: I): void;
}

export interface CommandOptions<I extends ICommand = ICommand> {
	Name: string;
	Execute: ExecuteCommandFunction<I>;
	Permissions: Array<PermissionString>;
	Roles: Array<Snowflake>;
	Aliases: Array<string>;
}

export interface ICommand {
	readonly Name: string;
	readonly _execute: ExecuteCommandFunction;
}

export type RunCommandArgs = [name: string] | [command: Command];

export default class Command<Options extends CommandOptions = CommandOptions>
	implements ICommand
{
	public readonly Name: string;
	public readonly _execute: ExecuteCommandFunction<ICommand>;
	public Permissions: Array<PermissionString>;

	public static Run(...args: RunCommandArgs) {
		const [nameOrCommand] = args;

		if (typeof nameOrCommand === 'string') {
      const name = nameOrCommand;

		} else {
      const command = nameOrCommand;

      
		}
	}

	constructor(options: Options) {
		const { Name, Execute, Permissions } = options;
		this.Name = Name;
		this._execute = Execute;
		this.Permissions = Permissions;
	}
}
