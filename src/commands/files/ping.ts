import { Message, MessageEmbed } from 'discord.js';
import { CommandOptions } from '../_base/Command';

export default {
	Name: 'ping',
	Aliases: ['p'],
	Permissions: [],
	Roles: [],
	// Implement Later
	// AllowChannels
	Execute(client, args, message, command) {
		const sentAt = message.createdTimestamp;

		const sendMsg = new MessageEmbed();
    
		message.reply({
      content: `Pong! Your Ping is ${(sendMsg.timestamp ?? Date.now()) - sentAt}`,
      // reply: message.author
    });
	},
} as CommandOptions;
