type Include<T, K> = T extends K ? T : never;

type ElementOf<TArray extends Array<any> | ReadonlyArray<any>> = TArray extends Array<infer R> ? R : TArray extends ReadonlyArray<infer R> ? R : never;

type SystemError = {
    address?: string;
    code: string;
    dest?: string;
    errno: number;
    info?: any;
    message: string;
    path?: string;
    port?: number;
    syscall: string;
}

type Func<Input, Output> = (...args: Input) => Output;

type IQueryableArgument<TInput, TResult = never> =
    | TInput
    | Func<[token: TInput, index: number, array: Array<TInput>], TResult>
    | string;

interface IQueryable<T> {
    has(query: IQueryableArgument<T, boolean>): boolean;
    get(query: IQueryableArgument<T, boolean>): T | null;
    map<R>(selector: Exclude<IQueryableArgument<T, R>, T | string>): Array<R>;
}