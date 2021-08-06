// https://discord.js.org/#/docs/main/stable/typedef/ClientOptions
export default {
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
