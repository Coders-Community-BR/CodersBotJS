import { MessageEmbed } from 'discord.js';
import { CommandOptions } from '../_base/Command';
import { ECommandType } from '../_base/Enum';

export default {
    Name: 'ping',
    Aliases: ['p'],
    Permissions: [],
    Roles: [],
    // Implement Later
    // AllowChannels
    Execute: (client, args, message, _command) => {
        const sentAt = message.createdTimestamp;

        const sendMsg = new MessageEmbed()
            .setTitle('Pong!')
            .setDescription('Ping Received And Retrieved.')
            .addField('🌐 • WebSocket Ping', client.ws.ping + 'ms');

        message
            .reply({
                content: 'Pinging...',
            })
            .then(async (m) => {
                sendMsg.addField('⏳ • Response Ping', m.createdTimestamp - sentAt + 'ms');
                await m.edit({
                    content: '',
                    embed: sendMsg,
                });
            });
    },
    Type: ECommandType._Base,
    ShowTyping: true,
} as CommandOptions;
