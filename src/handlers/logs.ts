import { FileHandle, appendFile } from 'fs/promises';
import { open } from 'node:fs/promises';
import CodersBot from '~/CodersBot';
import { resolve } from '~/utils';
import Handler from './_base';

export enum ELogsHandlerLevel {
    Silent,
    Fatal,
    Error,
    Warn,
    Info,
    Verbose,
}

export interface LogsHandlerOptions {
    level: ELogsHandlerLevel;
    path: string;
    id: string;
}

export default class LogHandler extends Handler<LogsHandlerOptions> {
    private filename!: string;
    private fileHandle: FileHandle | null = null;

    public async PrepareToLog(date: Date) {
        try {
            const filename = `${date
                .toLocaleDateString('pt-BR')
                .replace(/(\d{2})\/(\d{2})\/(\d{4})/g, '$3-$2-$1')}-${this.config.id}.log`;

            if (this.fileHandle) {
                await this.fileHandle.close();
            }

            this.fileHandle = await open(resolve(CodersBot.paths.logsDir, filename), 'w');
            this.filename = filename;
        } catch (e: unknown) {
            let fatal = false;
            const loggedAt = new Date();
            const errorMessage = `ERROR AT 'LogsHandler.PrepareToLog', ${e} - [${loggedAt.toLocaleString(
                'pt-BR'
            )}]`;

            if (this.config.id === 'errors') {
                errorMessage.concat(' - [FATAL] Error occurred when trying to prepare to log');
                fatal = true;
            }

            CodersBot.ErrorLogger.Write(errorMessage, loggedAt, fatal);

            console.error(errorMessage);
        }
    }

    constructor(options: LogsHandlerOptions) {
        super(options);

        this.Write = this.Write.bind(this);
        this.WriteLine = async (data, timeStamp, fatal) =>
            this.Write(data + '\n', timeStamp, fatal);
    }

    /**
     * Avoid using 'await' on write, it should be considered a background job operation
     * @param timeStamp
     * @param fatal
     * @param data
     */
    public async Write(data: string, timeStamp?: Date, fatal?: boolean) {
        if (!timeStamp) timeStamp = new Date();

        if (
            !fatal &&
            `${timeStamp
                .toLocaleDateString('pt-BR')
                .replace(/(\d{2})\/(\d{2})\/(\d{4})/g, '$3-$2-$1')}-${this.config.id}.log` !==
                this.filename
        ) {
            this.PrepareToLog(timeStamp).then(() => this.Write(data, timeStamp));
            return;
        }

        try {
            if (!this.fileHandle) {
                throw ReferenceError(
                    'fileHandle is null. Be sure to call PrepareToLog before start'
                );
            }

            let writeLog = data;
            if (!writeLog.includes(`${timeStamp.toLocaleString('pt-BR')}`)) {
                writeLog += ` - [${timeStamp.toLocaleString('pt-BR')}]`;
            }

            await appendFile(this.fileHandle, writeLog, 'utf-8');
        } catch (e: unknown) {
            const loggedAt = new Date();
            const errorMessage = `ERROR AT 'LogsHandler.Log', ${e} - [${loggedAt.toLocaleString(
                'pt-BR'
            )}]`;

            if (!fatal) CodersBot.ErrorLogger.Write(errorMessage, loggedAt);

            console.error(errorMessage);
        }
    }

    public async WriteLine(data: string, timeStamp?: Date, fatal?: boolean) {
        if (!timeStamp) timeStamp = new Date();
        if (
            !fatal &&
            `${timeStamp
                .toLocaleDateString('pt-BR')
                .replace(/(\d{2})\/(\d{2})\/(\d{4})/g, '$3-$2-$1')}-${this.config.id}.log` !==
                this.filename
        ) {
            this.PrepareToLog(timeStamp).then(() => this.WriteLine(data, timeStamp));
            return;
        }

        try {
            if (!this.fileHandle) {
                throw ReferenceError(
                    'fileHandle is null. Be sure to call PrepareToLog before start'
                );
            }

            let writeLog = data;
            if (!writeLog.includes(`${timeStamp.toLocaleString('pt-BR')}`)) {
                writeLog += ` - [${timeStamp.toLocaleString('pt-BR')}]`;
            }
            writeLog += '\n';

            await appendFile(this.fileHandle, writeLog, 'utf-8');
        } catch (e: unknown) {
            const loggedAt = new Date();
            const errorMessage = `ERROR AT 'LogsHandler.Log', ${e} - [${loggedAt.toLocaleString(
                'pt-BR'
            )}]`;

            if (!fatal) CodersBot.ErrorLogger.Write(errorMessage, loggedAt);

            console.error(errorMessage);
        }
    }
}
