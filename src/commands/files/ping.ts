import { MessageEmbed } from 'discord.js';
import { CommandOptions } from '../_base/Command';
import { ECommandType } from '../_base/Enum';

export default {
	Name: 'ping',
	Aliases: ['p'],
	Permissions: {
		OneOf: ['ADMINISTRATOR',"ADD_REACTIONS"]
	},
	Roles: [],
    Description: 'Envia Um Ping Ao Bot E Retorna O Valor.',
	// Implement Later
	// AllowChannels
	Execute: async (client, args, message, _command) => {
		console.log('AAAAA')
		const sentAt = message.createdTimestamp;

        const sendMsg = new MessageEmbed()
            .setTitle('Pong!')
            .setDescription('Ping Received And Retrieved.')
            .addField('🌐 • WebSocket Ping', client.ws.ping + 'ms');

		const m = await message.reply({
			content: 'Pinging...',
		});

		sendMsg.addField('⏳ • Response Ping', m.createdTimestamp - sentAt + 'ms');
		
		await m.edit({
			content: '',
			embed: sendMsg,
		});
	},
	Type: ECommandType._Base,
	ShowTyping: true,
} as CommandOptions;
