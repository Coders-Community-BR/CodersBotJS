import { UsageObject } from '~/commands/_base/Command';
import { isFlag, isFunction, isSameValue } from '~/utils/assert';
import { TokenArgument } from './args';

export type FlagType = string | number | boolean | null;

export interface Flag<Ftype extends FlagType = FlagType> {
  name: string;
  value: Ftype;
  matchesType: boolean;
  aliases: string[];
  isRanBeforeCommand: boolean;
  description: string | null;
  specialFlag: boolean;
}

export class Flags implements ArrayLike<Readonly<Flag>>, IQueryable<Readonly<Flag>> {
  public readonly length: number;
  [index: number]: Readonly<Flag>;
  private readonly flagsMetadata: Readonly<UsageObject['flags']>;

  constructor(flagsMetadata: UsageObject['flags'], lookupFlags: Array<TokenArgument>) {
    this.flagsMetadata = Object.seal(Object.freeze(flagsMetadata));
    this.toArray = this.toArray.bind(this);
    let flagIndex = 0;

    if (this.flagsMetadata) {
      const flagMetadataLength = this.flagsMetadata?.length ?? 0;
      iterateMetadata: for (let i = 0; i < flagMetadataLength; i++) {
        const flagMetadata = this.flagsMetadata[i];
        let lookupFor: Array<string> = [];

        if (!flagMetadata) continue iterateMetadata;
        const isRanBeforeCommand = typeof flagMetadata.RunBeforeCommand === 'function';
        const name = flagMetadata.name;
        const aliases = [...(flagMetadata.aliases ?? [])];
        const description = flagMetadata.description ?? null;
        const specialFlag = !!flagMetadata.SpecialFlag;

        const metaData: Pick<Flag, 'aliases' | 'description' | 'isRanBeforeCommand' | 'name' | 'specialFlag'> = {
          aliases,
          description,
          isRanBeforeCommand,
          name,
          specialFlag
        };
        lookupFor = [flagMetadata.name, ...(flagMetadata.aliases ?? [])];

        iterateArgs: for (const lookup of lookupFlags) {
          if (!lookup) continue iterateArgs;

          const j = lookupFlags.indexOf(lookup);

          if (!lookup.isQuoted) {
            if (lookupFor.includes(lookup.content)) {
              lookupFlags.splice(j, 1);

              const type = flagMetadata.type;
              switch (type) {
                case 'boolean':
                  {
                    const flag: Flag<true> = {
                      matchesType: true,
                      value: true,
                      ...metaData
                    };
                    this[flagIndex] = flag;

                    flagIndex++;
                  }
                  break;
                case 'number':
                  {
                    const lookupValue = lookupFlags.splice(j, 1)[0];
                    if (lookupValue) {
                      const tryParseValue = parseFloat(lookupValue.content);

                      const value = isNaN(tryParseValue) ? lookupValue.content : tryParseValue;

                      const flag: Flag<typeof value> = {
                        ...metaData,
                        matchesType: value === tryParseValue,
                        value
                      };

                      this[flagIndex] = flag;
                      flagIndex++;
                    } else {
                      const flag: Flag = {
                        ...metaData,
                        matchesType: false,
                        value: null
                      };

                      this[flagIndex] = flag;
                      flagIndex++;
                    }
                  }
                  break;
                case 'string':
                  {
                    const lookupValue = lookupFlags.splice(j, 1)[0];

                    if (lookupValue) {
                      const value = lookupValue.content;

                      const flag: Flag<typeof value> = {
                        ...metaData,
                        matchesType: true,
                        value
                      };

                      this[flagIndex] = flag;
                      flagIndex++;
                    } else {
                      const flag: Flag = {
                        ...metaData,
                        matchesType: false,
                        value: null
                      };

                      this[flagIndex] = flag;
                      flagIndex++;
                    }
                  }
                  break;
              }

              continue iterateMetadata;
            } else continue iterateArgs;
          }
        }
      }
      this.length = flagIndex;
    } else {
      this.length = 0;
    }
  }

  public [Symbol.iterator]: Func<[], IterableIterator<Readonly<Flag>>> =
    Array.prototype.values.bind(this);

  public toArray() {
    return Array(...this);
  }

  public getMetadata() {
    return this.flagsMetadata ?? null;
  }

  public get(query: IQueryableArgument<Readonly<Flag>, boolean>) {
    const arg = query;

    if (arg === null || arg === undefined) throw TypeError("'query' is null or undefined");

    if (isFunction(arg)) {
      const arr = Array.from(this);
      for (let i = 0; i < arr.length; i++) {
        const token = arr[i]!;
        const result = arg(token, i, arr);
        if (result) return token;
      }
    } else if (isFlag(arg)) {
      for (const token of this)
        if (isSameValue(arg, token)) return token;
    } else if (typeof arg === 'string') {
      for (const token of this) {
        if(token.name === arg) return token;
        else if(token.aliases.includes(arg)) return token;
      }
    } else throw TypeError("'query' is invalid");

    return null;
  }

  public has(query: IQueryableArgument<Readonly<Flag>, boolean>) {
   const arg = query;

   if (arg === null || arg === undefined) throw TypeError("'query' is null or undefined");

   if (isFunction(arg)) {
     const arr = Array.from(this);
     for (let i = 0; i < arr.length; i++) {
       const token = arr[i]!;
       const result = arg(token, i, arr);
       if (result) return true;
     }
   } else if (isFlag(arg)) {
     for (const token of this) if (isSameValue(arg, token)) return true;
   } else if (typeof arg === 'string') {
     for (const token of this) {
       if (token.name === arg) return true;
       else if (token.aliases.includes(arg)) return true;
     }
   } else throw TypeError("'query' is invalid");

   return false;
  }

  public map<R>(
    selector: Exclude<IQueryableArgument<Readonly<Flag>, R>, Readonly<Flag> | string>
  ): Array<R> {
    const sel = selector;
    const map: Array<R> = [];
    const arr = Array.from(this);
    for (let i = 0; i < arr.length; i++) map.push(sel(arr[i]!, i, arr));
    return map;
  }
}
