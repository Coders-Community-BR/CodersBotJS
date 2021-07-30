import { GuildMember } from 'discord.js';

export type LogicalObject<T> = {
  OneOf?: Array<T>;
  All?: Array<T>;
}

export type ValidadeCallback = (member: GuildMember, checkAdmin?: boolean) => boolean;

export type ValidateCanUse<T> = LogicalObject<T> | Array<T> | ValidadeCallback;

export enum EValidationType {
  PermAndRole,
  PermOrRole
}

export enum EValidatorType {
  Array,
  Object,
  Callback
}

export function isValidatorLogicalObject<T>(x: unknown): x is LogicalObject<T> {
  const o = x as LogicalObject<T>;
  return o !== undefined && o !== null && (o.OneOf instanceof Array || o.All instanceof Array);
}

export interface ValidateMethod {
  (member: GuildMember, checkAdmin?: boolean): boolean;
}

export default abstract class Validator<T> {
  public readonly Type: EValidatorType;

  constructor(validator: ValidateCanUse<T>) {
    if(typeof validator === 'function') {
      this.Type = EValidatorType.Callback;
    } else if(validator instanceof Array) {
      this.Type = EValidatorType.Array;
    } else if(isValidatorLogicalObject(validator)) {
      this.Type = EValidatorType.Object;
    } else {
      throw TypeError('Illegal \'validator\'');
    }
  }
}