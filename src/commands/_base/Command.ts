import { Client, Message } from 'discord.js';
import CodersBot from '~/CodersBot';
import ArgsHandler, { ResolvedArguments } from '~/handlers/args';
import PermissionValidator, { ValidatePermission } from '../auth/Permissions';
import RoleValidator, { ValidateRole } from '../auth/Roles';
import { EValidationType } from '../auth/_base';
import { ECommandType } from './Enum';

export type ExecuteCommandFunction<TFlags extends keyof any, I extends ICommand<TFlags> = ICommand<TFlags>> = (
    client: Client,
    args: ResolvedArguments<TFlags>,
    message: Message,
    command: I
) => void | PromiseLike<void>;

export type StopCommandExecutionFunction = () => void;

export type RunBeforeCommandFunction<TFlags extends keyof any, I extends ICommand<TFlags> = ICommand<TFlags>> = (
    ...args: [...args: Parameters<ExecuteCommandFunction<TFlags, I>>, stop: StopCommandExecutionFunction]
) => ReturnType<ExecuteCommandFunction<TFlags>>;

export type UsageFlag<TName extends string = string, Flags extends keyof any = string> = {
    type: 'string' | 'boolean' | 'number';
    name: TName;
    aliases?: Array<string>;
    values?: Array<string | number>;
    description?: string;
    RunBeforeCommand?: RunBeforeCommandFunction<Flags>;
};

export type UsageArgument = {
    label?:  string;
    type?: 'string' | 'boolean' | 'number';
    values?: Array<string | number>;
    description?: string;
}

export type UsageObject<TFlags extends keyof any = string> = {
    args?: ReadonlyArray<UsageArgument>;
    flags?: ReadonlyArray<UsageFlag<Include<TFlags, string>, TFlags>>;
};

export interface CommandOptions<TFlags extends keyof any = string, I extends ICommand<TFlags> = ICommand<TFlags>> {
    Name: string;
    Execute: ExecuteCommandFunction<TFlags, I>;
    Permissions?: ValidatePermission;
    Roles?: ValidateRole;
    Aliases?: Array<string>;
    Type?: ECommandType;
    ValidationType?: EValidationType;
    ShowTyping?: boolean;
    Description?: string;
    CheckAdmin?: boolean;
    Usage?: Readonly<UsageObject<TFlags>>;
}

export interface ICommand<TFlags extends keyof any> {
    readonly Name: string;
    readonly Permissions: ValidatePermission;
    readonly Roles: ValidateRole;
    readonly Aliases: Array<string>;
    readonly Type: ECommandType;
    readonly ShowTyping: boolean;
    readonly ValidationType: EValidationType;
    readonly Description: string;
    readonly CheckAdmin: boolean;
    readonly Usage: UsageObject<TFlags> | null;
    CanRun(message: Message): boolean;
}

export type RunCommandArgs = [name: string] | [command: Command];

export default class Command<TFlags extends keyof any = string, Options extends CommandOptions<TFlags> = CommandOptions<TFlags>> {
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
            Usage,
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

        if(Usage) {
            this.Usage = { ...Usage };
            this.argsHandler = new ArgsHandler<TFlags>({
                splitArgsMatch: /\s+/g,
                splitQuoted: /\s*'((?:(?!').)+)'\s*|\s*"((?:(?!").)+)"\s*/g,
                usageMetada: { ...Usage },
            });
        } else {
            this.Usage = null;
            this.argsHandler = new ArgsHandler<TFlags>({
                splitArgsMatch: /\s+/g,
                splitQuoted: /\s*'((?:(?!').)+)'\s*|\s*"((?:(?!").)+)"\s*/g,
                usageMetada: null,
            });
        } 
        
    }

    private argsHandler: ArgsHandler<TFlags>;

    public readonly client: Client;
    public readonly Name: string;
    public readonly _execute: ExecuteCommandFunction<TFlags, ICommand<TFlags>>;
    public readonly Permissions: PermissionValidator;
    public readonly Roles: RoleValidator;
    public readonly Type: number;
    public readonly Aliases: Array<string>;
    public readonly ShowTyping: boolean;
    public readonly Description: string;
    public readonly ValidationType: EValidationType;
    public readonly CheckAdmin: boolean;
    public readonly Usage: UsageObject<TFlags> | null;

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

    public async Run(message: Message, args?: Array<string>) {
        try {
            if (!this.CanRun(message, this.CheckAdmin)) return; // Handle Insufficient Permission Later

            const content = args && args.length ? args.join(' ') : message.content;
            const resArgs = this.argsHandler.ResolveArgs(content);

            this.ShowTyping && message.channel.startTyping();
            await Promise.resolve(
                this._execute(this.client, resArgs, message, {
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
                    Usage: this.Usage,
                })
            );
            this.ShowTyping && message.channel.stopTyping(true);
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
