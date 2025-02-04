import { Client } from 'discord.js';
import CodersBot from '~/CodersBot';
import RoleValidator from '../auth/Roles';
import Command, { CommandOptions } from './Command';

export default class StaffCommand<
  Options extends CommandOptions = CommandOptions
> extends Command<Options> {
  public override Roles: RoleValidator;
  constructor(options: Options, client: Client) {
    super(options, client);

    this.Roles = new RoleValidator(options.Roles ?? [], {
      OneOf: CodersBot.StaffRoles
    });
  }
}
