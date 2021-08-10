import { Client, Message, PermissionString, Snowflake } from 'discord.js';
import CodersBot from '~/CodersBot';
import { ResolvedArguments } from '~/handlers/args';
import PermissionValidator, { ValidatePermission } from '../auth/Permissions';
import RoleValidator, { ValidateRole } from '../auth/Roles';
import { EValidationType, LogicalObject } from '../auth/_base';
import { ECommandType } from './Enum';

export type ExecuteCommandFunction<
  I extends ICommand = ICommand
> = (
  client: Client,
  args: ResolvedArguments,
  message: Message,
  command: I
) => void | PromiseLike<void>;

export type StopCommandExecutionFunction = () => void;

export type RunBeforeCommandFunction<
  I extends ICommand = ICommand
> = (
  ...args: [
    ...args: Parameters<ExecuteCommandFunction<I>>,
    stop: StopCommandExecutionFunction
  ]
) => ReturnType<ExecuteCommandFunction>;

export type UsageFlag = {
  type: 'string' | 'boolean' | 'number';
  name: string;
  aliases?: Array<string>;
  values?: Array<string | number>;
  description?: string;
  RunBeforeCommand?: RunBeforeCommandFunction;
  SpecialFlag?: boolean;
};

export type UsageArgument = {
  label?: string;
  type?: 'string' | 'boolean' | 'number';
  values?: Array<string | number>;
  description?: string;
};

export type UsageObject = {
  args?: ReadonlyArray<UsageArgument>;
  flags?: ReadonlyArray<UsageFlag>;
};

export interface CommandOptions<
  I extends ICommand = ICommand
> {
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
  Usage?: Readonly<UsageObject>;
  DisablePermissionWarning?: boolean;
}

export interface ICommand {
  readonly Name: string;
  readonly Permissions: ValidatePermission;
  readonly Roles: ValidateRole;
  readonly Aliases: Array<string>;
  readonly Type: ECommandType;
  readonly ShowsTyping: boolean;
  readonly ValidationType: EValidationType;
  readonly Description: string;
  readonly ChecksAdmin: boolean;
  readonly DisablesPermissionWarning: boolean;
  readonly Usage: UsageObject | null;
  CanRun(message: Message): boolean;
}

export type RunCommandArgs = [name: string] | [command: Command];

export interface CanRunReport {
  result: boolean;
  MissingRoles: LogicalObject<Snowflake>;
  MissingPermissions: LogicalObject<PermissionString>;
}

const defaultFlags: ReadonlyArray<UsageFlag> = [
  {
    name: '--permissions',
    type: 'boolean',
    aliases: ['--perms'],
    SpecialFlag: true
  }
];

export default class Command<
  Options extends CommandOptions = CommandOptions
> {
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
      DisablePermissionWarning
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
    this.DisablePermissionWarning = DisablePermissionWarning ?? false;
    this.Usage = Usage
      ? { args: Usage.args, flags: defaultFlags.concat(Usage.flags ?? []) }
      : { flags: defaultFlags };
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
  public readonly Usage: UsageObject | null;
  public readonly DisablePermissionWarning: boolean;

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
    const commandInterface: ICommand = {
      Aliases: this.Aliases,
      CanRun: this.CanRun,
      Name: this.Name,
      Permissions: this.Permissions.validator,
      Roles: this.Roles.validator,
      Type: this.Type,
      ShowsTyping: this.ShowTyping,
      Description: this.Description,
      ValidationType: this.ValidationType,
      ChecksAdmin: this.CheckAdmin,
      Usage: this.Usage,
      DisablesPermissionWarning: this.DisablePermissionWarning
    };
    let stopExec = false;
    const stop = () => {
      stopExec = true;
    };
    try {
      const content = args && args.length ? args.join(' ') : message.content;
      const resArgs = CodersBot.argsHandler.ResolveArgs(content, this.Usage);
      
      for(const flag of resArgs.flags) {
        if(flag.specialFlag) {
          const sFlagRun = CodersBot.commandPool.SpecialFlags.get(flag.name);
          if(!sFlagRun) continue;
          sFlagRun(CodersBot.Client, resArgs, message, commandInterface, stop);
        } else if(flag.isRanBeforeCommand) {
          const rbcFlag = resArgs.flags.getMetadata()?.find(f => f.name === flag.name)?.RunBeforeCommand;
          if(!rbcFlag) continue;
          rbcFlag(CodersBot.Client, resArgs, message, commandInterface, stop);
        } else continue;

        if(stopExec) return;
      }

      if (!this.CanRun(message, this.CheckAdmin))
        if (!this.DisablePermissionWarning)
          return message.reply(
            `Você não tem permissões suficientes para poder usar este comando. Verifique as permissões necessárias com ${CodersBot.prefix}${this.Name} --perms`
          );

      this.ShowTyping && message.channel.startTyping();
      await Promise.resolve(
        this._execute(this.client, resArgs, message, commandInterface)
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
