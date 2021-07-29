import { Message } from 'discord.js';
import CodersBot from '~/CodersBot';
import { ICommand } from '~/commands/_base/Command';
import LogsHandler, { ELogsHandlerLevel } from './logs';
import Handler from './_base';

export interface MessageHandlerConfig {
  prefix: string;
}

export default class MessageHandler extends Handler<MessageHandlerConfig> {
  private logger: LogsHandler;

  constructor(config: MessageHandlerConfig) {
    super(config);

    this.listener = this.listener.bind(this);
    this.logger = new LogsHandler({
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

		const c = (await import('../commands/files/ping')).default;
		c.Execute(CodersBot.Client, [], message, null as unknown as ICommand);
		// message.guild?.member(message.author)?.hasPermission
		// message.channel.send("test")
	}
}