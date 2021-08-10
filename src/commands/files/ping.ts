import { MessageEmbed } from 'discord.js';
import { CommandOptions } from '../_base/Command';
import { ECommandType } from '../_base/Enum';

export default {
  Name: 'ping',
  Aliases: ['p'],
  Description: 'Envia Um Ping Ao Bot E Retorna O Valor.',
  // Implement Later
  // AllowChannels
  Execute: async (client, args, message, _command) => {
    const sentAt = message.createdTimestamp;

    const sendMsg = new MessageEmbed()
      .setTitle('Pong!')
      .setDescription('Ping Recebido E Retornado.')
      .addField('🌐 • Ping Da WebSocket', client.ws.ping + 'ms');
    const m = await message.reply({
      content: 'Pinging...'
    });
    sendMsg.addField('⏳ • Ping Da Resposta', m.createdTimestamp - sentAt + 'ms');
    await m.edit({
      content: null,
      embeds: [sendMsg]
    });
  },
  Type: ECommandType.Staff,
  ShowTyping: true
} as CommandOptions;
