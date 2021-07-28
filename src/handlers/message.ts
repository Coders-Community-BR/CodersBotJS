import { Message } from 'discord.js';
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

    // message.guild?.member(message.author)?.hasPermission
    // message.channel.send("test")
  }
}