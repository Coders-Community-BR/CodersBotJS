import { CommandOptions } from '../_base/Command';

export default {
	Name: 'ping',
	Aliases: ['p'],
	Permissions: [],
	Roles: [],
	// Implement Later
	// AllowChannels
	Execute(client, args, message, _command) {
		const sentAt = message.createdTimestamp;
    
		message.reply({
      content: `Pong!\n\tAPI ping is ${(Date.now()) - sentAt}.\n\tBot ping is ${client.ws.ping}`,
      // reply: message.author
    });
	},
} as CommandOptions;
