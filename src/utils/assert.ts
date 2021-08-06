export function isSystemError(x: unknown): x is SystemError {
    const err = x as SystemError;

    return err !== null && err !== undefined && typeof err.code === 'string' && typeof err.errno === 'number';
} 