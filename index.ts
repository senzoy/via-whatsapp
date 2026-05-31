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
  Slot,
  Ruleta,
  Inventario,
  ShopRob,
  BuyRob,
  Cheque,
  Parley,
} from './commands/index.js'
import cron from 'node-cron'
import { getBirthdaysToday } from "./db/mongodb.js";
import { resetAllDailyWithdraws, resetAllDailyYappy } from "./db/bank.js";
import type { WAMessage } from "baileys";

enum Commands {
  INFO = 'info',
  LOCK = 'lock',
  UNLOCK = 'unlock',
  BAN = 'ban',
  SET = 'set',
  TOP = 'top',
  TOPPOINTS = 'toppoints',
  SLOT = 'slot',
  RULETTE = 'roulette',
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
  INVENTARIO = 'inventario',
  TIENDAROB = 'tiendarob',
  COMPRAR = 'comprar',
  CHEQUE = 'cheque',
  PAGARNEYMAR = 'pagarneymar',
  PARLEY = 'parley'
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
Bot.command(Commands.YAPPY, (ctx) => {
  if (ctx.admin) Yappy(ctx)
})
Bot.command(Commands.WORK, (ctx) => {
  if (ctx.admin) Work(ctx)
})
Bot.command(Commands.ALBUM, (ctx) => {
  if (ctx.admin) Album(ctx)
})
Bot.command(Commands.WALLET, (ctx) => {
  if (ctx.admin) Wallet(ctx)
})
Bot.command(Commands.TOPPOINTS, (ctx) => {
  if (ctx.admin) Levels(ctx)
})
Bot.command(Commands.TOPMONEY, (ctx) => {
  if (ctx.admin) MoneyTop(ctx)
})
Bot.command(Commands.DAILY, (ctx) => {
  if (ctx.admin) Daily(ctx)
})
Bot.command(Commands.POINTS, (ctx) => {
  if (ctx.admin) Points(ctx)
})
Bot.command(Commands.BIRTHDAY, Birthday)
Bot.command('cumple', Birthday)
Bot.command(Commands.CUMPLEAÑOS, SopaDePata)
Bot.command(Commands.SOPADEPATA, SopaDePata)
Bot.command(Commands.BANK, (ctx) => {
  if (ctx.admin) Bank(ctx)
})
Bot.command(Commands.DEPOSIT, (ctx) => {
  if (ctx.admin) Deposit(ctx)
})
Bot.command(Commands.WITHDRAW, (ctx) => {
  if (ctx.admin) Withdraw(ctx)
})
Bot.command(Commands.ROB, (ctx) => {
  if (ctx.admin) Rob(ctx)
})
Bot.command(Commands.SLOT, (ctx) => {
  if (ctx.admin) Slot(ctx)
})
Bot.command(Commands.RULETTE, (ctx) => {
  if (ctx.admin) Ruleta(ctx)
})
Bot.command(Commands.MULTAS, (ctx) => {
  if (ctx.admin) Multas(ctx)
})
Bot.command(Commands.PAY, (ctx) => {
  if (ctx.admin) Pay(ctx)
})
// Bot.command(Commands.INVENTARIO, Inventario)
// Bot.command(Commands.TIENDAROB, ShopRob)
// Bot.command(Commands.COMPRAR, BuyRob)
Bot.command(Commands.CHEQUE, (ctx) => {
  if (ctx.admin) Cheque(ctx)
})
Bot.command(Commands.PARLEY, Parley)

// Reload pending cheques on restart
import { getAllUnprocessedCheques, completeCheque } from "./db/cheque.js";
import { AddBalance } from "./db/mongodb.js";
getAllUnprocessedCheques().then(cheques => {
  for (const c of cheques) {
    const delay = new Date(c.completesAt).getTime() - Date.now();
    if (delay <= 0) {
      AddBalance(c.receiverId, c.amount);
      completeCheque(c._id.toString());
    } else {
      setTimeout(async () => {
        await AddBalance(c.receiverId, c.amount);
        await completeCheque(c._id.toString());
        Bot.sendMessage({
          msg: null as unknown as WAMessage,
          jid: c.jid,
          content: `✅ Cheque de $${c.amount.toLocaleString('en-US')} de @${c.senderId.split('@')[0]} fue entregado a @${c.receiverId.split('@')[0]}.`,
          mentions: [c.senderId, c.receiverId],
          delay: 1000,
        });
      }, delay);
    }
  }
  console.log(`🔄 ${cheques.length} cheques pendientes restaurados.`);
});

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
  await resetAllDailyYappy();
  console.log('🔄 Límites diarios bancarios reiniciados.');
}, {
  timezone: 'America/Panama'
});

// ─── Casino schedule (Panama time) ─────────────────────────────────────────────

const CASINO_ANNOUNCEMENT = `🚨📢 *ANUNCIO OFICIAL* 📢🚨

🎰🔥 *¡EL CASINO VOLVIÓ DESDE LAS 9:20PM - 9:30PM!* 🔥🎰

🥶💸 *¡Busquen su nevera y recen que no explote su teléfono porque esto se va a poner loco!* 📱💥

💰🎯 Con un *JACKPOT DE 10 MILLONES* esperando dueño 😱🔥

🎁✨ Además, *BONO ESPECIAL DE 20K* para entrar a jugar 💸🔥

━━━━━━━━━━━━━━━
🎲 **COMANDOS DEL CASINO** 🎲

🎡 *Ruleta*
!roulette <rojo | negro> <apuesta>

💡 Ejemplo:
!roulette rojo 5000

🎰 *Slot Machine*
!slot <apuesta>

💡 Ejemplo:
!slot 2500
━━━━━━━━━━━━━━━

🍀 Hoy la suerte puede cambiarlo TODO…
🏆💵 entra ahora y no dejes que otro se lleve el premio gigante.`;

const CASINO_GROUP = '120363407682059377@g.us';

// 9:00 PM — Announcement
cron.schedule('35 20 * * *', async () => {
  console.log('🎰 Enviando anuncio de casino (9 PM)...');
  Bot.sendMessage({
    msg: null as unknown as WAMessage,
    jid: CASINO_GROUP,
    content: CASINO_ANNOUNCEMENT,
    delay: 1000,
  });
}, {
  timezone: 'America/Panama'
});

// 9:10 PM — 20K bonus to all members
cron.schedule('10 21 * * *', async () => {
  console.log('🎰 Repartiendo bono de 20K (9:10 PM)...');
  try {
    const meta = await Bot.getGroupMetadata(CASINO_GROUP);
    const participants = meta.participants.map(p => p.id);
    for (const pid of participants) {
      await AddBalance(pid, 20000);
    }
    Bot.sendMessage({
      msg: null as unknown as WAMessage,
      jid: CASINO_GROUP,
      content: `🎁 *BONO DE BIENVENIDA* 🎁\n\n🔥 Se acreditaron $20,000 a todos los miembros.`,
      delay: 1000,
    });
  } catch {
    console.error('Error en grupo casino');
  }
}, {
  timezone: 'America/Panama'
});

// 9:20 PM — Casino opens
cron.schedule('20 21 * * *', async () => {
  console.log('🎰 Casino abierto (9:20 PM)...');
  Bot.sendMessage({
    msg: null as unknown as WAMessage,
    jid: CASINO_GROUP,
    content: `🎰 *CASINO ABIERTO* 🎰\n\n🔥 El casino ya está disponible. ¡Suerte a todos!`,
    delay: 1000,
  });
}, {
  timezone: 'America/Panama'
});

// 9:30 PM — Casino closed
cron.schedule('30 21 * * *', async () => {
  console.log('🎰 Casino cerrado (9:30 PM)...');
  Bot.sendMessage({
    msg: null as unknown as WAMessage,
    jid: CASINO_GROUP,
    content: '🚫 *CASINO CERRADO* 🚫\n\nEl casino ha cerrado por hoy. ¡Nos vemos en la próxima ronda!',
    delay: 1000,
  });
}, {
  timezone: 'America/Panama'
});

// 10:00 PM — Announcement + casino opens
cron.schedule('0 22 * * *', async () => {
  console.log('🎰 Casino abierto (10 PM)...');
  Bot.sendMessage({
    msg: null as unknown as WAMessage,
    jid: CASINO_GROUP,
    content: `🎰 *CASINO ABIERTO* 🎰\n\n🔥 Segunda ronda — el casino está disponible. ¡Aprovecha!`,
    delay: 1000,
  });
}, {
  timezone: 'America/Panama'
});

// 10:10 PM — Casino closed
cron.schedule('10 22 * * *', async () => {
  console.log('🎰 Casino cerrado (10:10 PM)...');
  Bot.sendMessage({
    msg: null as unknown as WAMessage,
    jid: CASINO_GROUP,
    content: '🚫 *CASINO CERRADO* 🚫\n\nEl casino ha cerrado por hoy. ¡Nos vemos en la próxima ronda!',
    delay: 1000,
  });
}, {
  timezone: 'America/Panama'
});