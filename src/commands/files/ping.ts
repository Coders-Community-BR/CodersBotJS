import { MessageEmbed } from 'discord.js';
import { CommandOptions, UsageFlag } from '../_base/Command';
import { ECommandType } from '../_base/Enum';

const Usage = {
    flags: [
        {
            name: '--help',
            type: 'boolean'
        },
        {
            name: '--test',
            type: 'string',
            description: 'testtt',
            aliases: ['-t']
        } as UsageFlag
    ]
};

export default {
    Name: 'ping',
    Aliases: ['p'],
    Description: 'Envia Um Ping Ao Bot E Retorna O Valor.',
    Usage,
    // Implement Later
    // AllowChannels
    Execute: async (client, args, message, _command) => {
        const sentAt = message.createdTimestamp;

        console.log(args, '\n\n');

        const sendMsg = new MessageEmbed()
            .setTitle('Pong!')
            .setDescription('Ping Recebido E Retornado.')
            .addField('🌐 • Ping Da WebSocket', client.ws.ping + 'ms');

        const m = await message.reply({
            content: 'Pinging...'
        });

        sendMsg.addField('⏳ • Ping Da Resposta', m.createdTimestamp - sentAt + 'ms');

        await m.edit({
            content: '',
            embed: sendMsg
        });
    },
    Type: ECommandType._Base,
    ShowTyping: true
} as CommandOptions<ElementOf<typeof Usage['flags']>['name']>;
