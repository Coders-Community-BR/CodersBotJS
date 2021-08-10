import { TokenArgument } from '~/handlers/args';
import { Flag } from '~/handlers/flags';

export function isSystemError(x: unknown): x is NodeJS.ErrnoException {
  const err = x as NodeJS.ErrnoException;

  return (
    err !== null &&
    err !== undefined &&
    typeof err.code === 'string' &&
    typeof err.errno === 'number'
  );
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
  return func !== null && func !== undefined && typeof func === 'function';
}

export function isTokenArgument(x: unknown): x is TokenArgument {
  const tok = x as TokenArgument;

  return (
    tok !== null &&
    tok !== undefined &&
    typeof tok.content === 'string' &&
    typeof tok.isQuoted === 'boolean'
  );
}

export function isFlag(x: unknown): x is Flag {
  const flag = x as Flag;

  return (
    flag !== null &&
    flag !== undefined &&
    flag.aliases instanceof Array &&
    typeof flag.description === 'string' &&
    typeof flag.isRanBeforeCommand === 'boolean' &&
    typeof flag.matchesType === 'boolean' &&
    typeof flag.name === 'string' &&
    // eslint-disable-next-line
    // @ts-ignore
    { string: true, boolean: true, number: true }[typeof flag.value]!
  );
}

export function isSameValue<T extends Indexed<any>>(left: T, right: T, depth = 1) {
  for (const key of Object.getOwnPropertyNames(left)) {
    const result = left[key] === right[key];
    if (!result && typeof left[key] === 'object' && typeof right[key] === 'object' && depth > 1)
      if (!isSameValue(left[key], right[key], depth - 1)) return false;
    else if(!result) return false;
  }

  return true;
}


export function CountInArray<T>(array: Array<T> | ReadonlyArray<T>, selector: ((el: T) => boolean) | T) {
  let count = 0;
  for(const el of array) {
    const toCount = isFunction(selector) ? selector(el) : selector;
    
    if(typeof selector === 'function' && toCount) count++
    else if(toCount === el) count++
  }

  return count;
}