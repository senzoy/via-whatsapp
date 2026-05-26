import { Bot } from "./core/core.js";
import dotenv from 'dotenv';
dotenv.config()

import {
  Profile,
  Lock,
  Unlock,
  Warn,
  Warnings,
  Top,
  Kick,
  Yappy,
  Work,
  Levels,
  Wallet,
  MoneyTop,
  Daily,
  Points,
  Verify,
  Album,
  Birthday,
  SopaDePata,
  Bank,
  Deposit,
  Withdraw,
  Rob,
  Multas,
  Pay,
} from './commands/index.js'
import cron from 'node-cron'
import { getBirthdaysToday } from "./db/mongodb.js";
import { resetAllDailyWithdraws } from "./db/banco.js";
import type { WAMessage } from "baileys";

enum Commands {
  INFO = 'info',
  LOCK = 'lock',
  UNLOCK = 'unlock',
  BAN = 'ban',
  SET = 'set',
  TOP = 'top',
  TOPPOINTS = 'toppoints',
  WARNINGS = 'warnings',
  WARN = 'warn',
  RESUME = 'resume',
  PROFILE = 'profile',
  KICK = 'kick',
  STORE = 'shop',
  YAPPY = 'yappy',
  WORK = 'work',
  WALLET = 'wallet',
  TOPMONEY = 'topmoney',
  DAILY = 'daily',
  POINTS = 'points',
  BIRTHDAY = 'birthday',
  SOPADEPATA = 'sopadepata',
  CUMPLEAÑOS = 'cumpleaños',
  VERIFY = 'verify',
  ALBUM = 'maxnini',
  NEYMAR = 'neymar',
  BANK = 'bank',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  ROB = 'rob',
  MULTAS = 'multas',
  PAY = 'pay',
  PAGARNEYMAR = 'pagarneymar'
}

await Bot.connect()

Bot.command(Commands.PROFILE, (ctx) => {
  if (ctx.admin) Profile(ctx)
})
Bot.command(Commands.LOCK, (ctx) => {
  if (ctx.admin) Lock(ctx)
})
Bot.command(Commands.UNLOCK, (ctx) => {
  if (ctx.admin) Unlock(ctx)
})
Bot.command(Commands.WARN, (ctx) => {
  if (ctx.admin) Warn(ctx)
})
Bot.command(Commands.WARNINGS, (ctx) => {
  if (ctx.admin) Warnings(ctx)
})
Bot.command(Commands.TOP, (ctx) => {
  if (ctx.admin) Top(ctx)
})
Bot.command(Commands.KICK, (ctx) => {
  if (ctx.admin) Kick(ctx)
})
Bot.command(Commands.VERIFY, Verify)
Bot.command(Commands.YAPPY, Yappy)
Bot.command(Commands.WORK, Work)
Bot.command(Commands.ALBUM, (ctx) => {
  if (ctx.admin) Album(ctx)
})
Bot.command(Commands.WALLET, Wallet)
Bot.command(Commands.TOPPOINTS, (ctx) => {
  if (ctx.admin) Levels(ctx)
})
Bot.command(Commands.TOPMONEY, (ctx) => {
  if (ctx.admin) MoneyTop(ctx)
})
Bot.command(Commands.DAILY, Daily)
Bot.command(Commands.POINTS, (ctx) => {
  if (ctx.admin) Points(ctx)
})
Bot.command(Commands.BIRTHDAY, Birthday)
Bot.command('cumple', Birthday)
Bot.command(Commands.CUMPLEAÑOS, (ctx) => {
  if (ctx.admin) SopaDePata(ctx)
})
Bot.command(Commands.SOPADEPATA, (ctx) => {
  if (ctx.admin) SopaDePata(ctx)
})
Bot.command(Commands.BANK, Bank)
Bot.command(Commands.DEPOSIT, Deposit)
Bot.command(Commands.WITHDRAW, Withdraw)
Bot.command(Commands.ROB, Rob)
Bot.command(Commands.MULTAS, Multas)
Bot.command(Commands.PAY, Pay)

cron.schedule('1 0 * * *', async () => {
  console.log('🎂 Verificando cumpleaños de hoy...');

  const users = await getBirthdaysToday();

  for (const user of users) {
    await Bot.sendMessage({
      msg: null as unknown as WAMessage,
      jid: user.group || '',
      content: `🎂 ¡Feliz cumpleaños 🎂🎉\n *${user.name}* que tengas un día increíble 🥳✨\n¡Disfrútalo al máximo! 🎁🔥`,
      mentions: [user.lib || ''],
      delay: 2000
    });
  }

}, {
  timezone: 'America/Panama'
});

cron.schedule('0 0 * * *', async () => {
  await resetAllDailyWithdraws();
  console.log('🔄 Límites diarios bancarios reiniciados.');
}, {
  timezone: 'America/Panama'
});