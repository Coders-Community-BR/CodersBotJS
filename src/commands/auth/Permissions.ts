import { PermissionString } from 'discord.js';
import Validator, { EValidatorType, LogicalObject, ValidadeCallback, ValidateCanUse, ValidateMethod } from './_base';

export type ValidatePermission = ValidateCanUse<PermissionString>;

export type PermissionArray = Array<PermissionString>;

export default class PermissionValidator extends Validator<PermissionString> {
    public readonly validate: ValidateMethod;

    constructor(validator: ValidateCanUse<PermissionString>) {
        super(validator);

        switch (this.Type) {
            case EValidatorType.Callback:
                this.validate = (validator as ValidadeCallback).bind(null);
                break;
            case EValidatorType.Object:
                this.validate = (member, checkAdmin) => {
                    const perms = validator as LogicalObject<PermissionString>;

                    const matchAll = (perms.All?.length ?? 0) > 0 
                        ? member.hasPermission(perms.All!, { checkAdmin })
                        : true;
                    
                    const matchOneOf = (perms.OneOf?.length ?? 0) > 0
                        ? perms.OneOf!.some(p => member.permissions.has(p))
                        : true;

                    return matchAll && matchOneOf;
                };
                break;
            case EValidatorType.Array:
                this.validate = (member, checkAdmin) => {
                    const perms = validator as PermissionArray;
                    return perms.length > 0
                        ? member.hasPermission(perms, { checkAdmin })
                        : true;
                };
                break;
        }
    }
}