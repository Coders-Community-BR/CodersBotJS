import { Message } from "discord.js";

export const onMessageAtSuggestionsChannels = async (message: Message) => {
	console.log(`[SUGGESTION] ${message.content}`)
	await message.react("👍")
	await message.react("👎")
}
