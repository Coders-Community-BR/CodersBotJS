import { CommandOptions } from '../_base/Command';
import { ECommandType } from '../_base/Enum';
import { MessageEmbed } from 'discord.js';
import { MessageButton } from 'discord-buttons';

export default {
  Name: 'conteudos',
  Aliases: ['acpe'],
  Execute: async (_client, _args, message, _command) => {
    message.channel.stopTyping(true);
    const selectContentMessage = new MessageEmbed()
      .setColor(0xadadeb)
      .setDescription('Qual tipo de conteúdo você quer?');
    const officialButton = new MessageButton()
      .setID(`${message.id}-btn-ofc`)
      .setLabel('oficial')
      .setStyle('blurple');
    const nOfficialButton = new MessageButton()
      .setID(`${message.id}-btn-nofc`)
      .setLabel('não-oficial')
      .setStyle('red');

    const msg = await message.reply(selectContentMessage, {
      buttons: [officialButton, nOfficialButton]
    });
    const collector = msg.createButtonCollector((_u) => true);
    collector.on('collect', async (button) => {
      if (button.clicker.id != message.author.id) {
        button.reply.send(`somente o ${message.author} pode clicar nesse butao`);
        return;
      }
      if (button.id == `${message.id}-btn-ofc`)
        message.reply('os conteudos oficiais estao disponiveis em: <#844012455906508852>');
      else {
        officialButton.setLabel('não, vou ficar nos oficiais mesmo');
        nOfficialButton.setLabel('sim, eu vou querer os não-oficiais');
        button.reply.defer(false);
        const confirmMessage = selectContentMessage.setDescription(
          'A fonte desse conteúdo não é oficial. Deseja continuar?'
        );
        const newMessage = msg.edit(confirmMessage, {
          buttons: [officialButton, nOfficialButton]
        } as any);
        (await newMessage)
          .createButtonCollector((_u) => true)
          .on('collect', async (button) => {
            if (button.clicker.id != message.author.id) {
              button.reply.send(`somente o ${message.author} pode clicar nesse butao`);
              return;
            }
            let channel = await message.guild?.channels.cache.find((ch) => ch.name == 'conteudo-nao-oficial');
            if (!channel) {
              channel = await message.guild?.channels.create('conteudo-nao-oficial', {
                reason: 'coders-bot'
              });
            }

            channel?.updateOverwrite(message.author, { VIEW_CHANNEL: true });

            const doneMessage = confirmMessage.setDescription(
              'pronto! Agora você pode ver os conteudos não-oficiais'
            );
            (await newMessage).delete().catch(console.error);
            message.reply(doneMessage);
          });
      }
    });
  },
  Type: ECommandType._Base,
  ShowTyping: true,
  Description: 'Ganha Acesso À Vários Conteúdos Para Estudo.'
} as CommandOptions;
