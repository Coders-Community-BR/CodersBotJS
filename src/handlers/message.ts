import { Message } from 'discord.js';
import CodersBot from '~/CodersBot';
import LogHandler, { ELogsHandlerLevel } from './logs';
import Handler from './_base';

export interface MessageHandlerConfig {
  prefix: string;
}

export default class MessageHandler extends Handler<MessageHandlerConfig> {
  private logger: LogHandler;

  constructor(config: MessageHandlerConfig) {
    super(config);

    this.listener = this.listener.bind(this);
    this.logger = new LogHandler({
      id: 'message',
      level: ELogsHandlerLevel.Verbose,
      path: CodersBot.paths.logsDir
    })
  }

  public async listener(message: Message) {
		/*

    Implementar Algum Analisador?

    */

    this.logger.WriteLine(`MESSAGE: '${message.content}'\n\tsent by [${message.author.id}:${message.author.username}]\n\tin [${message.channel.id}:${message.guild?.name ?? message.author.username}]\n\tat [${new Date().toLocaleString('pt-BR')}]`)

		if (message.author.bot || !message.content.startsWith(this.config.prefix))
			return;

    const args = message.content.split(/\s+/g);
    const cmd = args.shift()?.substring(this.config.prefix.length);
    
    if(cmd) await CodersBot.TryRun(cmd, message)
	}
}