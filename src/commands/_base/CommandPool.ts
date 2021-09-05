import { Dirent } from 'fs';
import { opendir } from 'fs/promises';
import CodersBot from '~/CodersBot';
import LogHandler from '~/handlers/logs';
import { resolve } from '~/utils';
import { CountInArray } from '~/utils/assert';
import { EValidationType, isValidatorLogicalObject } from '../auth/_base';
import AdminCommand from './AdminCommand';
import Command, { CommandOptions, RunBeforeCommandFunction } from './Command';
import { ECommandType } from './Enum';
import StaffCommand from './StaffCommand';

export default class CommandPool {
  private ErrorLogger: LogHandler;

  private _commands: Map<string, Command>;

  public SpecialFlags: Map<string, RunBeforeCommandFunction>;

  public path: string;

  constructor(path: string) {
    this.path = path;
    this.ErrorLogger = CodersBot.ErrorLogger;
    this._commands = new Map();
    this.SpecialFlags = new Map();

    this.loadSpecialFlags();
  }
  
  private loadSpecialFlags() {
    this.SpecialFlags.set('--permissions', (client, args, message, command, stop) => {
      const canRun = command.CanRun(message);
      const validationText = command.ValidationType === EValidationType.PermAndRole ? 'e ' : 'ou ';
      let permissionText = '';
      if (command.Permissions instanceof Array) {
        permissionText +=
          command.Permissions.length === 0
            ? `Nenhuma permissão necessária `
            : `Permissões necessárias: \`${command.Permissions.join(', ')}\` `;
      } else if (isValidatorLogicalObject(command.Permissions)) {
        command.Permissions.All &&
          command.Permissions.All.length > 0 &&
          (permissionText += `Permissões necessárias: \`${command.Permissions.All.join(', ')}\` `);

        command.Permissions.OneOf &&
          command.Permissions.OneOf.length > 0 &&
          (permissionText += `É necessário ter uma entre essas permissões: \`${command.Permissions.OneOf.join(
            ', '
          )}\` `);

        permissionText.length === 0 && (permissionText += `Nenhuma permissão necessária `);
      } else permissionText += 'As permissões foram sobrescritas ';

      let rolesText = '';
      if (command.Roles instanceof Array) {
        rolesText +=
          command.Roles.length === 0
            ? `nenhum cargo necessário `
            : `cargos necessários: \`${command.Roles.map(
                (r) => message.guild?.roles.cache.get(r)?.name
              )
                .filter((r) => Boolean(r))
                .join(', ')}\` `;
      } else if (isValidatorLogicalObject(command.Roles)) {
        command.Roles.All &&
          command.Roles.All.length > 0 &&
          (rolesText += `cargos Necessários: \`${command.Roles.All.map(
            (r) => message.guild?.roles.cache.get(r)?.name
          )
            .filter((r) => Boolean(r))
            .join(', ')}\` `);

        command.Roles.OneOf &&
          command.Roles.OneOf.length > 0 &&
          (rolesText += `é necessário ter um entre esses cargos: \`${command.Roles.OneOf.map(
            (r) => message.guild?.roles.cache.get(r)?.name
          )
            .filter((r) => Boolean(r))
            .join(', ')}\` `);

        rolesText.length === 0 && (rolesText += `nenhum cargo necessário `);
      } else rolesText += 'os cargos foram sobrescritos ';

      const result =
        `Você ${canRun ? '' : 'não '}pode usar este comando. ` +
        permissionText +
        validationText +
        rolesText;

      message.reply({
        content: result
      });

      stop();
    });
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
          case ECommandType.Admin:
            command = new AdminCommand(commandOpts, CodersBot.Client);
            break;
          case ECommandType.Staff:
            command = new StaffCommand(commandOpts, CodersBot.Client);
            break;
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

        if (commandOpts.Usage?.flags) {
          for (const flag of commandOpts.Usage?.flags) {
            if (
              CountInArray(
                commandOpts.Usage.flags.reduce((res, curr) => {
                  return res.concat([curr.name, ...(curr.aliases ?? [])]);
                }, [] as Array<string>),
                (f) => f === flag.name
              ) > 1
            ) {
              console.error(
                `FLAG NAME OVERLAPS AT COMMAND "${commandOpts.Name}": FLAG NAME ${flag.name}`
              );
              process.exit(1);
            }

            if (
              CountInArray(
                commandOpts.Usage.flags.reduce((res, curr) => {
                  return res.concat([curr.name, ...(curr.aliases ?? [])]);
                }, [] as Array<string>),
                (f) => !!flag.aliases?.includes(f)
              ) > 1
            ) {
              console.error(
                `FLAG ALIAS OVERLAPS AT COMMAND "${commandOpts.Name}": FLAG ALIASES ${flag.aliases}`
              );
              process.exit(1);
            }
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
    const commandArray = new Array<Tresult>();
    const cmdIterator = this._commands.entries();

    for (let i = 0; i < arrayLimit; i++) {
      const result = cmdIterator.next();

      if (result.done) break;
      if (result.value[1].Name !== result.value[0]) continue;

      commandArray.push(callback(result.value[1]));
    }

    return commandArray;
  }
}
