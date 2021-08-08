import { Snowflake } from 'discord.js';
import Validator, {
  EValidatorType,
  LogicalObject,
  ValidadeCallback,
  ValidateCanUse,
  ValidateMethod
} from './_base';

export type ValidateRole = ValidateCanUse<Snowflake>;

export type RoleArray = Array<Snowflake>;

export default class RoleValidator extends Validator<Snowflake> {
  public readonly validate: ValidateMethod;

  constructor(validator: ValidateRole, additionalValidator?: Exclude<ValidateRole, ValidadeCallback>) {
    super(validator, additionalValidator);
    switch (this.Type) {
      case EValidatorType.Callback:
        this.validate = (this.validator as ValidadeCallback).bind(null);
        break;
      case EValidatorType.Object:
        this.validate = (member, checkAdmin = true) => {
          if (checkAdmin && member.hasPermission('ADMINISTRATOR')) return true;

          const roles = this.validator as LogicalObject<Snowflake>;

          const matchAll =
            roles.All && roles.All.length > 0
              ? roles.All.every((r) => !!member.roles.cache.some((role) => role.id === r))
              : true;
          const matchOneOf =
            roles.OneOf && roles.OneOf.length > 0
              ? roles.OneOf.some((r) => !!member.roles.cache.some((role) => role.id === r))
              : true;
          return matchAll && matchOneOf;
        };
        break;
      case EValidatorType.Array:
        this.validate = (member, checkAdmin = true) => {
          if (checkAdmin && member.hasPermission('ADMINISTRATOR')) return true;
          const roles = this.validator as RoleArray;
          return roles.length > 0
            ? roles.every((r) => !!member.roles.cache.some((role) => role.id === r))
            : true;
        };
        break;
    }
  }
}
