import { Client, Message, PermissionString, Snowflake } from 'discord.js';
import { ECommandType } from './Enum';

export interface ExecuteCommandFunction<I extends ICommand = ICommand> {
	(client: Client, args: Array<string>, message: Message, command: I): void;
}

export interface CommandOptions<I extends ICommand = ICommand> {
	Name: string;
	Execute: ExecuteCommandFunction<I>;
	Permissions?: Array<PermissionString>;
	Roles?: Array<Snowflake>;
	Aliases?: Array<string>;
	Type?: ECommandType;
}

export interface ICommand {
	readonly Name: string;
	readonly Permissions: Array<PermissionString>;
	readonly Roles: Array<Snowflake>;
	readonly Aliases: Array<string>;
	readonly Type: ECommandType;
	CanRun(message: Message): boolean;
}

export type RunCommandArgs = [name: string] | [command: Command];

export default class Command<Options extends CommandOptions = CommandOptions>
	implements ICommand
{
	public readonly client: Client;
	public readonly Name: string;
	public readonly _execute: ExecuteCommandFunction<ICommand>;
	public Permissions: Array<PermissionString>;
	public readonly Type: number;
	public readonly Roles: Array<Snowflake>;
	public readonly Aliases: Array<string>;

	// public static Run(message: Message, ...args: RunCommandArgs) {
	// 	const [nameOrCommand] = args;

	// 	if (typeof nameOrCommand === 'string') {
	//     const name = nameOrCommand;

	// 	} else {
	//     const command = nameOrCommand;

	// 	}
	// }

	public Run(message: Message, args?: string[]) {
		try {
			if (!this.CanRun(message)) return; // Handle Insufficient Permission Later

			if (!args) {
				args = message.content
					.split(/("(?:(?!").)+")|('(?:(?!').)+')/g)
					.filter((v) => v !== undefined);
				
				args = args.map((v, i) => {
					if(i % 2 === 0) {
						return v.split(/\s+/g);
					}

					return v;
				}).flat();
			}

			this._execute(this.client, args, message, {
				Aliases: this.Aliases,
				CanRun: this.CanRun,
				Name: this.Name,
				Permissions: this.Permissions,
				Roles: this.Roles,
				Type: this.Type,
			});
		} catch (e: unknown) {
			const loggedAt = new Date();
			const errorMessage = `ERROR AT 'Command.Run', ${e} - [${loggedAt.toLocaleString(
				'pt-BR'
			)}]`;

			console.error(errorMessage);
		}
	}

	public CanRun(message: Message) {
		const guildMember = message.member;
		if (!guildMember) throw ReferenceError('Guild Member Could Not Be Found.');
		const hasRoles =
			this.Roles.length > 0
				? guildMember.roles
						.valueOf()
						.keyArray()
						.every((k) => this.Roles.includes(k))
				: true;

		const hasPermission =
			this.Permissions.length > 0
				? guildMember.hasPermission(this.Permissions)
				: true;
		return hasPermission && hasRoles;
	}

	constructor(options: Options, client: Client) {
		const { Name, Execute, Permissions, Type, Aliases, Roles } = options;
		this.client = client;
		this.Name = Name;
		this._execute = Execute;
		this.Permissions = [...(Permissions ?? [])];
		this.Type = Type ?? ECommandType._Base;
		this.Aliases = [...(Aliases ?? [])];
		this.Roles = [...(Roles ?? [])];
		this.Run = this.Run.bind(this);
		this.CanRun = this.CanRun.bind(this);
	}
}
