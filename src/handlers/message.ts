import { Message } from 'discord.js';
import CodersBot from '~/CodersBot';
import { ICommand } from '~/commands/_base/Command';
import Handler from './_base';

export interface MessageHandlerConfig {
  prefix: string;
}

export default class MessageHandler extends Handler<MessageHandlerConfig> {
  constructor(config: MessageHandlerConfig) {
    super(config);

    this.listener = this.listener.bind(this);
  }

  public async listener(message: Message) {
    if(message.author.bot || !message.content.startsWith(this.config.prefix)) return;

    const c = (await import('../commands/files/ping')).default;
    c.Execute(CodersBot.Client, [], message, null as unknown as ICommand);
    // message.guild?.member(message.author)?.hasPermission
    // message.channel.send("test")
  }
}