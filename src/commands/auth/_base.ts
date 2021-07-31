import { GuildMember } from 'discord.js';

export type LogicalObject<T> = {
    OneOf?: Array<T>;
    All?: Array<T>;
};

export type ValidadeCallback = (member: GuildMember, checkAdmin?: boolean) => boolean;

export type ValidateCanUse<T> = LogicalObject<T> | Array<T> | ValidadeCallback;

export enum EValidationType {
    PermAndRole,
    PermOrRole,
}

export enum EValidatorType {
    Array,
    Object,
    Callback,
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
    public readonly validator: ValidateCanUse<T>;

    public abstract readonly validate: ValidateMethod;

    constructor(validator: ValidateCanUse<T>, additionalValidator?: Exclude<ValidateCanUse<T>, ValidadeCallback>) {
        let _validator: ValidateCanUse<T>;
        const validatorIsObject = isValidatorLogicalObject(validator);
        const addValidatorIsObject = isValidatorLogicalObject(additionalValidator);
        const validatorIsArray = validator instanceof Array;
        const addValidatorIsArray = additionalValidator instanceof Array;
        if (typeof validator === 'function') {
            _validator = validator;
        } else if (validatorIsArray && addValidatorIsArray) {
            _validator = [...validator, ...additionalValidator];
        } else if (validatorIsObject || addValidatorIsObject) {
            if (validatorIsObject) {
                _validator = validator;

                if (addValidatorIsArray) {
                    if (!_validator.All) {
                        _validator.All = [...additionalValidator];
                    } else {
                        _validator.All.push(...additionalValidator);
                    }
                } else {
                    if (!_validator.All) {
                        _validator.All = additionalValidator?.All;
                    } else if (additionalValidator?.All && additionalValidator.All.length) {
                        _validator.All.push(...additionalValidator.All);
                    }

                    if (!_validator.OneOf) {
                        _validator.OneOf = additionalValidator?.OneOf;
                    } else if (additionalValidator?.OneOf && additionalValidator.OneOf.length) {
                        _validator.OneOf.push(...additionalValidator.OneOf);
                    }
                }
            } else if (addValidatorIsObject) {
                _validator = additionalValidator;

                if (!_validator.All) {
                    _validator.All = [...validator];
                } else {
                    _validator.All.push(...validator);
                }
            } else {
                throw TypeError("Illegal 'validator'");
            }
        } else if (validatorIsArray) { 
            _validator = [...validator];
        } else {
            throw TypeError("Illegal 'validator'");
        }

        this.validator = _validator;

        if (typeof validator === 'function') {
            this.Type = EValidatorType.Callback;
        } else if (validator instanceof Array) {
            this.Type = EValidatorType.Array;
        } else if (isValidatorLogicalObject(validator)) {
            this.Type = EValidatorType.Object;
        } else {
            throw TypeError("Illegal 'validator'");
        }
    }
}
