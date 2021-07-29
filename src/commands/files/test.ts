import { CommandOptions } from '../_base/Command';

export default {
  Execute: async (client, args, message, command) => {
    console.log(args);
    message.channel.send("Teste");
  },
  Name: "test",
} as CommandOptions;