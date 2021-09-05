import { CommandOptions } from '../_base/Command';
import { ECommandType } from '../_base/Enum';
import { MessageActionRow, MessageButton } from 'discord.js';
import cfg from '../../config/command.config.js';
interface User {
  pingCount: number;
  _: any;
}
interface Users {
  [index: string]: User;
}
const users: Users = {};

const canPing = (id: string) =>
  (users[id] != undefined && ((users[id] as User).pingCount < 2)) ||
  users[id] == undefined;
const add = (id: string) =>
  users[id] == undefined
    ? (users[id] = { pingCount: 1, _: setTimeout(() => delete users[id] && console.log(`${id} já pode marcar os helpers novamente.`), 24 * 3600000) })
    : (users[id] as User).pingCount++;
export default {
  Name: 'helpers',
  Aliases: ['marcar-helpers', 'hlps'],
  Execute: async (client, _args, AuthorMessage, _command) => {
    const channelID = AuthorMessage.channel.id;

    let id: number | undefined = undefined;
    switch (channelID) {
      case cfg.ids.channels.rust:
        id = cfg.ids.roles.helpers.rust;
        break;

      default:
        AuthorMessage.reply('ei! esse canal não é de duvidas.');
        return;
    }
    const yesId = `${AuthorMessage.channel.id}_${AuthorMessage.id}.Yes`;
    const noId = `${AuthorMessage.channel.id}_${AuthorMessage.id}.No`;
    const row = new MessageActionRow().addComponents(
      new MessageButton().setCustomId(yesId).setLabel('sim').setStyle('SUCCESS'),
      new MessageButton().setCustomId(noId).setLabel('não').setStyle('DANGER')
    );

    AuthorMessage.reply({
      components: [row],
      content:
        'Você tem certeza que quer marcar os helpers? Você só pode marcar **duas vezes** por **dia**.'
    })
      .then((message) =>
        message
          .awaitMessageComponent({
            filter: (it) => it.user.id == AuthorMessage.author.id
          })
          .then((it) =>
            it.isButton()
              ? it.customId == yesId
                ? canPing(it.user.id)
                  ? message.channel.send(
                      `<@${id}>; ${AuthorMessage.author} está precisando de ajuda.`
                    ) &&
                    (add(it.user.id) as any) &&
                    message.delete()
                  : AuthorMessage.reply('você já marcou os dois helpers diarios!') &&
                    message.delete()
                : undefined
              : undefined
          )
      )
      .catch(console.error);
  },
  Type: ECommandType._Base,
  ShowTyping: true,
  Description: 'marca os helpers'
} as CommandOptions;
