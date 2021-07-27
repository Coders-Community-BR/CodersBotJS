require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
client.once('ready', () => console.log(`${client.user.tag} rodando!`));

client.on('message', message => {
  console.log(message.content)
});

client.login(process.env.DISCORD_TOKEN);