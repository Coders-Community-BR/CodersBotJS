import { Client } from 'discord.js';
import PermissionValidator from '../auth/Permissions';
import Command, { CommandOptions } from './Command';

export default class AdminCommand<
  Options extends CommandOptions = CommandOptions
> extends Command<Options> {
  public override Roles: PermissionValidator;
  constructor(options: Options, client: Client) {
    super(options, client);

    this.Roles = new PermissionValidator(options.Permissions ?? [], ['ADMINISTRATOR']);
  }
}
