import { Intents } from 'discord.js'
// https://discord.js.org/#/docs/main/stable/typedef/ClientOptions
export default {
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
	presence: {
		status: 'online',
		activity: {
			type: 'PLAYING',
			name: 'JavaScript',
		},
	},
	retryLimit: 3,
	http: {
		version: 7,
	},
};
