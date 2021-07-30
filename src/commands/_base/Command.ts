import { Client, Message, PermissionString, Snowflake } from 'discord.js';
import CodersBot from '~/CodersBot';
import PermissionValidator from '../auth/Permissions';
import { ValidateCanUse } from '../auth/_base';
import { ECommandType } from './Enum';

export interface ExecuteCommandFunction<I extends ICommand = ICommand> {
    (client: Client, args: Array<string>, message: Message, command: I): void | PromiseLike<void>;
}

export interface CommandOptions<I extends ICommand = ICommand> {
    Name: string;
    Execute: ExecuteCommandFunction<I>;
    Permissions?: ValidateCanUse<PermissionString>;
    Roles?: Array<Snowflake>;
    Aliases?: Array<string>;
    Type?: ECommandType;
    ShowTyping?: boolean;
    Description?: string;
}

export interface ICommand {
    readonly Name: string;
    // readonly Permissions: Array<PermissionString>;
    readonly Roles: Array<Snowflake>;
    readonly Aliases: Array<string>;
    readonly Type: ECommandType;
    readonly ShowTyping: boolean;
    readonly Description: string;
    CanRun(message: Message): boolean;
}

export type RunCommandArgs = [name: string] | [command: Command];

export default class Command<Options extends CommandOptions = CommandOptions> implements ICommand {
    constructor(options: Options, client: Client) {
        const { Name, Execute, Permissions, Type, Aliases, Roles, ShowTyping, Description } =
            options;
        this.client = client;
        this.Name = Name;
        this._execute = Execute;
        this.Permissions = new PermissionValidator(Permissions ?? []);
        this.Type = Type ?? ECommandType._Base;
        this.Aliases = [...(Aliases ?? [])];
        this.Roles = [...(Roles ?? [])];
        this.Run = this.Run.bind(this);
        this.CanRun = this.CanRun.bind(this);
        this.ShowTyping = ShowTyping ?? false;
        this.Description = Description ?? '';
    }

    public readonly client: Client;
    public readonly Name: string;
    public readonly _execute: ExecuteCommandFunction<ICommand>;
    public readonly Permissions: PermissionValidator;
    public readonly Type: number;
    public readonly Roles: Array<Snowflake>;
    public readonly Aliases: Array<string>;
    public readonly ShowTyping: boolean;
    public readonly Description: string;

    public static async Run(message: Message, ...args: RunCommandArgs) {
        const [nameOrCommand] = args;
        let command: Command;
        if (typeof nameOrCommand === 'string') {
            const name = nameOrCommand;
            const _temp = CodersBot.commandPool.get(name);

            if (!_temp) return;

            command = _temp;
        } else {
            command = nameOrCommand;
        }

        await command.Run(message);
    }

    public async Run(message: Message, args?: string[]) {
        try {
            if (!this.CanRun(message)) return; // Handle Insufficient Permission Later

            if (!args) {
                args = message.content
                    .split(/("(?:(?!").)+")|('(?:(?!').)+')/g)
                    .filter((v) => v !== undefined);

                args = args
                    .map((v, i) => {
                        if (i % 2 === 0) {
                            return v.split(/\s+/g);
                        }

                        return v;
                    })
                    .flat();
            }

            this.ShowTyping && message.channel.startTyping();
            await Promise.resolve(
                this._execute(this.client, args, message, {
                    Aliases: this.Aliases,
                    CanRun: this.CanRun,
                    Name: this.Name,
                    // Permissions: this.Permissions,
                    Roles: this.Roles,
                    Type: this.Type,
                    ShowTyping: this.ShowTyping,
                    Description: this.Description,
                })
            );
            this.ShowTyping && message.channel.stopTyping();
        } catch (e: unknown) {
            const loggedAt = new Date();
            const errorMessage = `ERROR AT 'Command.Run', ${e} - [${loggedAt.toLocaleString(
                'pt-BR'
            )}]`;

            console.error(errorMessage);
        }
    }

    public CanRun(message: Message, checkAdmin?: boolean) {
        const guildMember = message.member;
        if (!guildMember) throw ReferenceError('Guild Member Could Not Be Found.');
        const hasRoles =
            this.Roles.length > 0
                ? guildMember.roles
                      .valueOf()
                      .keyArray()
                      .every((k) => this.Roles.includes(k))
                : true;

        const hasPermission = this.Permissions.validate(guildMember, checkAdmin);

        return hasPermission && hasRoles;
    }
}
