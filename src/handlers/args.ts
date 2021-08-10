import { UsageObject } from '~/commands/_base/Command';
import Handler from './_base';

export interface ResolvedArgumentsOptions<T extends keyof any> {
    args: Array<TokenArgument>;
    flags: Flags<T>;
    raw: Array<string>;
}

export class ResolvedArguments<T extends keyof any = string> implements ArrayLike<TokenArgument> {
    public readonly length: number;
    [index: number]: TokenArgument;

    public readonly flags: Flags<T>;
    public readonly raw: Array<string>;

    constructor(options: ResolvedArgumentsOptions<T>) {
        let argIndex = -1;
        const { args, flags, raw } = options;
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];

            if (!arg) continue;

            argIndex = i;

            this[i] = { ...arg };
        }

        this.flags = flags;
        this.raw = raw;
        this.length = argIndex + 1;
    }

    public [Symbol.iterator] = Array.prototype.values.bind(this)

    public toArray() {
        return Array(...this);
    }
}

// export class ResolvedArguments<T extends keyof any> implements ArrayLike<string> {
//     constructor()
// }

export type FlagType = string | number | boolean | null;

export interface Flag<Ftype extends FlagType = FlagType> {
    name: string;
    value: Ftype;
    matchesType: boolean;
    aliases: string[];
    isRanBeforeCommand: boolean;
    description: string | null;
}

export function IsArrayOfArray<T = any>(x: unknown): x is Array<Array<T>> {
    const arr = x as Array<Array<T>>;

    return arr !== undefined && arr !== null && arr[0] instanceof Array;
}

export class TokenArgument {
    constructor(content: string, isQuoted?: boolean) {
        this.content = content;
        this.isQuoted = isQuoted ?? false;
    }

    public readonly content: string;
    public readonly isQuoted: boolean;
}

export class Flags<K extends keyof any> implements ArrayLike<Readonly<Flag>> {
    public readonly length: number;
    [index: number]: Readonly<Flag>;
    private readonly flagsMetadata: Readonly<UsageObject<K>['flags']>;

    constructor(flagsMetadata: UsageObject<K>['flags'], lookupFlags: Array<TokenArgument>) {
        this.flagsMetadata = Object.freeze(flagsMetadata);
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

                const metaData: Pick<
                    Flag,
                    'aliases' | 'description' | 'isRanBeforeCommand' | 'name'
                > = {
                    aliases,
                    description,
                    isRanBeforeCommand,
                    name,
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
                                            ...metaData,
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

                                            const value = isNaN(tryParseValue)
                                                ? lookupValue.content
                                                : tryParseValue;

                                            const flag: Flag<typeof value> = {
                                                ...metaData,
                                                matchesType: value === tryParseValue,
                                                value,
                                            };

                                            this[flagIndex] = flag;
                                            flagIndex++;
                                        } else {
                                            const flag: Flag = {
                                                ...metaData,
                                                matchesType: false,
                                                value: null,
                                            };

                                            this[flagIndex] = flag;
                                            flagIndex++;
                                        }
                                    }
                                    break;
                                case 'string':
                                    {
                                        const lookupValue = lookupFlags.splice(j,1)[0];

                                        if (lookupValue) {
                                            const value = lookupValue.content;

                                            const flag: Flag<typeof value> = {
                                                ...metaData,
                                                matchesType: true,
                                                value,
                                            };

                                            this[flagIndex] = flag;
                                            flagIndex++;
                                        } else {
                                            const flag: Flag = {
                                                ...metaData,
                                                matchesType: false,
                                                value: null,
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

    public [Symbol.iterator] = Array.prototype.values.bind(this);

    public toArray() {
        return Array(...this);
    }

    public getMetadata() {
        return this.flagsMetadata ?? null;
    }
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
        const splitQuotedArgs = content
            .split(this.config.splitQuoted)
            .filter((v) => v !== undefined);
        const firstArg = splitQuotedArgs.shift() ?? '';

        if (splitQuotedArgs.length === 0) splitQuotedArgs.push('');

        const rawArgs = splitQuotedArgs
            .reduce((prev, curr, i) => {
                let result: Array<string> = [];
                if (i === 0 && prev.length > 1) {
                    lookupFlags.push(...Array.from(prev.slice(1), (l) => new TokenArgument(l)));
                }

                if (i % 2 === 1) {
                    result = curr.split(this.config.splitArgsMatch).filter(v => v !== '');
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
            raw: rawArgs,
        });
    }
}
