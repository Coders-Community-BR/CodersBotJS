import { resolve as _resolve } from 'path';
import CodersBot from '~/CodersBot';

/**
 * Returns The Resolved Path Relative To Root Dir (CWD)
 * @param path Path Relative To Root
 */
export function resolve(...paths: string[]) {
  return _resolve(CodersBot.cwd, ...paths);
}