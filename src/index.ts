const startedAt = new Date();

import dotenv from 'dotenv';
dotenv.config();

import botConfig from '../config/bot.config';
import cmdConfig from '../config/command.config';
import CodersBot from './CodersBot';
import LogsHandler, { ELogsHandlerLevel } from './handlers/logs';
import MessageHandler from './handlers/message';

CodersBot.init(botConfig, cmdConfig);

CodersBot.loadPaths();

CodersBot.onceReady = () => {
	console.log(`${CodersBot.Client.user?.tag} Ready!`);
	
};

const messageHandler = new MessageHandler(cmdConfig);

CodersBot.ErrorLogger = new LogsHandler({
	id: 'error',
	level: ELogsHandlerLevel.Verbose,
	path: CodersBot.paths.logsDir,
});

CodersBot.ErrorLogger.PrepareToLog(startedAt).then(() => {
	CodersBot.onMessage(messageHandler.listener);
	CodersBot.login(process.env['DISCORD_TOKEN']);
});
