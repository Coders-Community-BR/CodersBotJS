import { TokenArgument } from '~/handlers/args';

export function isSystemError(x: unknown): x is NodeJS.ErrnoException {
    const err = x as NodeJS.ErrnoException;

    return err !== null && err !== undefined && typeof err.code === 'string' && typeof err.errno === 'number';
}

export interface Callable<ThisArg> {
    call(thisArg: ThisArg, ...args: any[]): any;
}

export function isCallable(x: unknown): x is Callable<any> {
    const callable = x as Callable<any>;

    return callable !== null && callable !== undefined && typeof callable.call === 'function';
}

export function isFunction(x: unknown): x is (...args: any) => any {
    const func = x as (...args: any) => any;

    return func !== null && func !== undefined && typeof func !== 'function';
}

export function isTokenArgument(x: unknown): x is TokenArgument {
    const tok = x as TokenArgument;

    return tok !== null && tok !== undefined && typeof tok.content === 'string' && typeof tok.isQuoted === 'boolean';
}