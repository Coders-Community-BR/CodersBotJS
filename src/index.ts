const startedAt = new Date();

import { ClientOptions } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

import botConfig from "../config/bot.config";
import cmdConfig from "../config/command.config";
import CodersBot, { CommandConfig } from "./CodersBot";
import LogHandler, { ELogsHandlerLevel } from "./handlers/logs";
import MessageHandler from "./handlers/message";

export default async function Startup() {
  CodersBot.init(botConfig as ClientOptions, cmdConfig as CommandConfig);

  CodersBot.loadPaths();

  CodersBot.ErrorLogger = new LogHandler({
    id: "error",
    level: ELogsHandlerLevel.Verbose,
    path: CodersBot.paths.logsDir,
  });

  await CodersBot.loadCommands();

  CodersBot.onceReady = () => {
    console.log(`${CodersBot.Client.user?.tag} Ready!`);
  };

  const messageHandler = new MessageHandler(cmdConfig);

  await CodersBot.ErrorLogger.PrepareToLog(startedAt);
  CodersBot.onMessage(messageHandler.listener);
  await CodersBot.login(process.env["DISCORD_TOKEN"]);
}
