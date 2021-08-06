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