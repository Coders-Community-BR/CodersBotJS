import { UsageObject } from '~/commands/_base/Command';
import { TokenArgument } from './args';

export type FlagType = string | number | boolean | null;

export interface Flag<Ftype extends FlagType = FlagType> {
  name: string;
  value: Ftype;
  matchesType: boolean;
  aliases: string[];
  isRanBeforeCommand: boolean;
  description: string | null;
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

        const metaData: Pick<Flag, 'aliases' | 'description' | 'isRanBeforeCommand' | 'name'> = {
          aliases,
          description,
          isRanBeforeCommand,
          name
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

  public [Symbol.iterator] = Array.prototype.values.bind(this);

  public toArray() {
    return Array(...this);
  }

  public getMetadata() {
    return this.flagsMetadata ?? null;
  }
}
