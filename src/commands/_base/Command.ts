import { Client, Message } from 'discord.js';
import CodersBot from '~/CodersBot';
import PermissionValidator, { ValidatePermission } from '../auth/Permissions';
import RoleValidator, { ValidateRole } from '../auth/Roles';
import { EValidationType } from '../auth/_base';
import { ECommandType } from './Enum';

export interface ExecuteCommandFunction<I extends ICommand = ICommand> {
    (client: Client, args: Array<string>, message: Message, command: I): void | PromiseLike<void>;
}

export interface CommandOptions<I extends ICommand = ICommand> {
    Name: string;
    Execute: ExecuteCommandFunction<I>;
    Permissions?: ValidatePermission;
    Roles?: ValidateRole;
    Aliases?: Array<string>;
    Type?: ECommandType;
    ValidationType?: EValidationType;
    ShowTyping?: boolean;
    Description?: string;
    CheckAdmin?: boolean;
}

export interface ICommand {
    readonly Name: string;
    readonly Permissions: ValidatePermission;
    readonly Roles: ValidateRole;
    readonly Aliases: Array<string>;
    readonly Type: ECommandType;
    readonly ShowTyping: boolean;
    readonly ValidationType: EValidationType;
    readonly Description: string;
    readonly CheckAdmin: boolean;
    CanRun(message: Message): boolean;
}

export type RunCommandArgs = [name: string] | [command: Command];

export default class Command<Options extends CommandOptions = CommandOptions> {
    constructor(options: Options, client: Client) {
        const {
            Name,
            Execute,
            Permissions,
            Type,
            Aliases,
            Roles,
            ShowTyping,
            Description,
            ValidationType,
            CheckAdmin,
        } = options;
        this.client = client;
        this.Name = Name;
        this._execute = Execute;
        this.Permissions = new PermissionValidator(Permissions ?? []);
        this.Type = Type ?? ECommandType._Base;
        this.Aliases = [...(Aliases ?? [])];
        this.Roles = new RoleValidator(Roles ?? []);
        this.Run = this.Run.bind(this);
        this.CanRun = this.CanRun.bind(this);
        this.ShowTyping = ShowTyping ?? false;
        this.Description = Description ?? '';
        this.ValidationType = ValidationType ?? EValidationType.PermAndRole;
        this.CheckAdmin = CheckAdmin ?? true;
    }

    public readonly client: Client;
    public readonly Name: string;
    public readonly _execute: ExecuteCommandFunction<ICommand>;
    public readonly Permissions: PermissionValidator;
    public readonly Roles: RoleValidator;
    public readonly Type: number;
    public readonly Aliases: Array<string>;
    public readonly ShowTyping: boolean;
    public readonly Description: string;
    public readonly ValidationType: EValidationType;
    public readonly CheckAdmin: boolean;

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
            if (!this.CanRun(message, this.CheckAdmin)) return; // Handle Insufficient Permission Later

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
                    .flat()
                    .filter((v) => v !== '');
            }

            this.ShowTyping && message.channel.startTyping();
            await Promise.resolve(
                this._execute(this.client, args, message, {
                    Aliases: this.Aliases,
                    CanRun: this.CanRun,
                    Name: this.Name,
                    Permissions: this.Permissions.validator,
                    Roles: this.Roles.validator,
                    Type: this.Type,
                    ShowTyping: this.ShowTyping,
                    Description: this.Description,
                    ValidationType: this.ValidationType,
                    CheckAdmin: this.CheckAdmin,
                })
            );
            this.ShowTyping && message.channel.stopTyping();
        } catch (e: unknown) {
            const loggedAt = new Date();
            const errorMessage = `ERROR AT 'Command.Run', ${
                (e as Error).stack
            } - [${loggedAt.toLocaleString('pt-BR')}]`;

            console.error(errorMessage);
        }
    }

    public CanRun(message: Message, checkAdmin?: boolean) {
        const guildMember = message.member;
        if (!guildMember) throw ReferenceError('Guild Member Could Not Be Found.');
        const hasRoles = this.Roles.validate(guildMember, checkAdmin);

        const hasPermission = this.Permissions.validate(guildMember, checkAdmin);

        return this.ValidationType === EValidationType.PermAndRole
            ? hasPermission && hasRoles
            : hasPermission || hasRoles;
    }
}
