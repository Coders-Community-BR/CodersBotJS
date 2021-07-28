import dotenv from 'dotenv';
dotenv.config();

import botConfig from '../config/bot.config';
import cmdConfig from '../config/command.config';
import CodersBot from './CodersBot';
import MessageHandler from './handlers/message';

const messageHandler = new MessageHandler(cmdConfig);

CodersBot.onceReady = () => {
	console.log(`${CodersBot.Client.user?.tag} Ready!`);
};

CodersBot.init(botConfig, cmdConfig);

CodersBot.onMessage(messageHandler.listener);

CodersBot.login(process.env['DISCORD_TOKEN']);