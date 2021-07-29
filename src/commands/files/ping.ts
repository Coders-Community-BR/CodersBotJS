import { CommandOptions } from '../_base/Command';
import { ECommandType } from '../_base/Enum';

export default {
	Name: 'ping',
	Aliases: ['p'],
	Permissions: [],
	Roles: [],
	// Implement Later
	// AllowChannels
	Execute: async (client, args, message, _command) => {
		const sentAt = message.createdTimestamp;
    
		message.reply({
      content: `Pong!\n\tAPI ping is ${(Date.now()) - sentAt}.\n\tBot ping is ${client.ws.ping}`,
      // reply: message.author
    });
	},
	Type: ECommandType._Base
} as CommandOptions;
