import { UsageObject } from '~/commands/_base/Command';
import { isFunction, isTokenArgument } from '~/utils/assert';
import { Flags } from './flags';
import Handler from './_base';

export interface ResolvedArgumentsOptions<T extends keyof any> {
  args: Array<TokenArgument>;
  flags: Flags<T>;
  raw: Array<string>;
}

export class ResolvedArguments<T extends keyof any = string>
  implements ArrayLike<Readonly<TokenArgument>>, IQueryable<Readonly<TokenArgument>>
{
  public readonly length: number;
  [index: number]: Readonly<TokenArgument>;

  public readonly flags: Flags<T>;
  public readonly raw: Array<string>;

  constructor(options: ResolvedArgumentsOptions<T>) {
    let argIndex = -1;
    const { args, flags, raw } = options;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (!arg) continue;

      argIndex = i;

      this[i] = Object.seal(Object.freeze(arg));
    }

    this.flags = flags;
    this.raw = raw;
    this.length = argIndex + 1;
  }

  public [Symbol.iterator]: Func<[], IterableIterator<Readonly<TokenArgument>>> =
    Array.prototype.values.bind(this);

  public toArray() {
    return Array(...this);
  }

  public get(query: IQueryableArgument<TokenArgument, boolean>) {
    const arg = query;

    if (arg === null || arg === undefined) throw TypeError("'query' is null or undefined");

    if (isFunction(arg)) {
      const arr = Array.from(this);
      for (let i = 0; i < arr.length; i++) {
        const token = arr[i]!;
        const result = arg(token, i, arr);
        if (result) return token;
      }
    } else if (isTokenArgument(arg)) {
      for (const token of this)
        if (arg.content === token.content && arg.isQuoted === token.isQuoted) return token;
    } else if (typeof arg === 'string') {
      for (const token of this) if (token.content === arg) return token;
    } else throw TypeError("'query' is invalid");

    return null;
  }

  public has(query: IQueryableArgument<TokenArgument, boolean>) {
    const arg = query;

    if (arg === null || arg === undefined) throw TypeError("'query' is null or undefined");

    if (isFunction(arg)) {
      const arr = Array.from(this);
      for (let i = 0; i < arr.length; i++) {
        const token = arr[i]!;
        const result = arg(token, i, arr);
        if (result) return true;
      }
    } else if (isTokenArgument(arg)) {
      for (const token of this)
        if (arg.content === token.content && arg.isQuoted === token.isQuoted) return true;
    } else if (typeof arg === 'string') {
      for (const token of this) if (token.content === arg) return true;
    } else throw TypeError("'query' is invalid");

    return false;
  }

  public map<R>(
    selector: Exclude<IQueryableArgument<TokenArgument, R>, TokenArgument | string>
  ): Array<R> {
    const sel = selector;
    const map: Array<R> = [];
    const arr = Array.from(this);
    for (let i = 0; i < arr.length; i++) map.push(sel(arr[i]!, i, arr));
    return map;
  }
}

export class TokenArgument {
  constructor(content: string, isQuoted?: boolean) {
    this.content = content;
    this.isQuoted = isQuoted ?? false;
  }

  public readonly content: string;
  public readonly isQuoted: boolean;
}

export interface ArgsHandlerOptions<Flags extends keyof any = string> {
  splitArgsMatch: string | RegExp;
  splitQuoted: string | RegExp;
  usageMetada: UsageObject<Flags> | null;
}

export default class ArgsHandler<TFlags extends keyof any = string> extends Handler<
  ArgsHandlerOptions<TFlags>
> {
  constructor(options: ArgsHandlerOptions<TFlags>) {
    super(options);

    this.ResolveArgs = this.ResolveArgs.bind(this);
  }

  public ResolveArgs(content: string): ResolvedArguments<TFlags> {
    const lookupFlags: Array<TokenArgument> = [];
    const splitQuotedArgs = content.split(this.config.splitQuoted).filter((v) => v !== undefined);
    const firstArg = splitQuotedArgs.shift() ?? '';

    if (splitQuotedArgs.length === 0) splitQuotedArgs.push('');

    const rawArgs = splitQuotedArgs
      .reduce((prev, curr, i) => {
        let result: Array<string> = [];
        if (i === 0 && prev.length > 1) {
          lookupFlags.push(...Array.from(prev.slice(1), (l) => new TokenArgument(l)));
        }

        if (i % 2 === 1) {
          result = curr.split(this.config.splitArgsMatch).filter((v) => v !== '');
          lookupFlags.push(...Array.from(result, (l) => new TokenArgument(l)));
        } else {
          if (curr !== '') {
            result = [curr];
            lookupFlags.push(new TokenArgument(curr, true));
          }
        }

        return prev.concat(...result);
      }, firstArg.split(/\s+/g))
      .filter((v) => v !== '')
      .slice(1);
    const flags = new Flags<TFlags>(this.config.usageMetada?.flags, lookupFlags);

    return new ResolvedArguments<TFlags>({
      args: lookupFlags,
      flags,
      raw: rawArgs
    });
  }
}
