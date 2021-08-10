import { MessageEmbed } from 'discord.js';
import CodersBot from '~/CodersBot';
import { CommandOptions } from '../_base/Command';

export default {
    Name: 'help',
    Aliases: ['h','ajuda'],
    Usage: {
        
    },
    Execute: async (_client, _args, message, _command) => {
        const commands = CodersBot.commandPool.Select(c => ({
            Name: c.Name,
            Aliases: [...c.Aliases],
            Description: c.Description,            
        }));

        const msg = new MessageEmbed()
            .setTitle("Comandos")
            .setDescription("Lista De Comandos Do Bot");

        if(CodersBot.defaultEmbedOptions.color) {
            msg.setColor(CodersBot.defaultEmbedOptions.color)
        }

        if(CodersBot.defaultEmbedOptions.image?.url) {
            msg.setThumbnail(CodersBot.defaultEmbedOptions.image.url)
        }

        for(let i = 0; i < commands.length; i++) {
            msg.addField(CodersBot.prefix + commands[i]?.Name, commands[i]?.Description);
        }

        message.channel.send(msg);
    },
    Description: 'Lista Os Comandos Do Bot'
} as CommandOptions;