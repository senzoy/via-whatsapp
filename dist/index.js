import { Bot } from "./core/core.js";
import dotenv from 'dotenv';
dotenv.config();
import { Profile, Lock, Unlock, Warn, Warnings, Top, Kick, Yappy, Work, Levels, Wallet, MoneyTop, Daily, Points, Verify, Album, Birthday, SopaDePata, Bank, Deposit, Withdraw, Rob, Multas, Pay, Inventario, ShopRob, BuyRob, Cheque, } from './commands/index.js';
import cron from 'node-cron';
import { getBirthdaysToday } from "./db/mongodb.js";
import { resetAllDailyWithdraws, resetAllDailyYappy } from "./db/banco.js";
var Commands;
(function (Commands) {
    Commands["INFO"] = "info";
    Commands["LOCK"] = "lock";
    Commands["UNLOCK"] = "unlock";
    Commands["BAN"] = "ban";
    Commands["SET"] = "set";
    Commands["TOP"] = "top";
    Commands["TOPPOINTS"] = "toppoints";
    Commands["WARNINGS"] = "warnings";
    Commands["WARN"] = "warn";
    Commands["RESUME"] = "resume";
    Commands["PROFILE"] = "profile";
    Commands["KICK"] = "kick";
    Commands["STORE"] = "shop";
    Commands["YAPPY"] = "yappy";
    Commands["WORK"] = "work";
    Commands["WALLET"] = "wallet";
    Commands["TOPMONEY"] = "topmoney";
    Commands["DAILY"] = "daily";
    Commands["POINTS"] = "points";
    Commands["BIRTHDAY"] = "birthday";
    Commands["SOPADEPATA"] = "sopadepata";
    Commands["CUMPLEA\u00D1OS"] = "cumplea\u00F1os";
    Commands["VERIFY"] = "verify";
    Commands["ALBUM"] = "maxnini";
    Commands["NEYMAR"] = "neymar";
    Commands["BANK"] = "bank";
    Commands["DEPOSIT"] = "deposit";
    Commands["WITHDRAW"] = "withdraw";
    Commands["ROB"] = "rob";
    Commands["MULTAS"] = "multas";
    Commands["PAY"] = "pay";
    Commands["INVENTARIO"] = "inventario";
    Commands["TIENDAROB"] = "tiendarob";
    Commands["COMPRAR"] = "comprar";
    Commands["CHEQUE"] = "cheque";
    Commands["PAGARNEYMAR"] = "pagarneymar";
})(Commands || (Commands = {}));
await Bot.connect();
Bot.command(Commands.PROFILE, (ctx) => {
    if (ctx.admin)
        Profile(ctx);
});
Bot.command(Commands.LOCK, (ctx) => {
    if (ctx.admin)
        Lock(ctx);
});
Bot.command(Commands.UNLOCK, (ctx) => {
    if (ctx.admin)
        Unlock(ctx);
});
Bot.command(Commands.WARN, (ctx) => {
    if (ctx.admin)
        Warn(ctx);
});
Bot.command(Commands.WARNINGS, (ctx) => {
    if (ctx.admin)
        Warnings(ctx);
});
Bot.command(Commands.TOP, (ctx) => {
    if (ctx.admin)
        Top(ctx);
});
Bot.command(Commands.KICK, (ctx) => {
    if (ctx.admin)
        Kick(ctx);
});
Bot.command(Commands.VERIFY, Verify);
Bot.command(Commands.YAPPY, Yappy);
Bot.command(Commands.WORK, Work);
Bot.command(Commands.ALBUM, (ctx) => {
    if (ctx.admin)
        Album(ctx);
});
Bot.command(Commands.WALLET, Wallet);
Bot.command(Commands.TOPPOINTS, (ctx) => {
    if (ctx.admin)
        Levels(ctx);
});
Bot.command(Commands.TOPMONEY, (ctx) => {
    if (ctx.admin)
        MoneyTop(ctx);
});
Bot.command(Commands.DAILY, Daily);
Bot.command(Commands.POINTS, (ctx) => {
    if (ctx.admin)
        Points(ctx);
});
Bot.command(Commands.BIRTHDAY, Birthday);
Bot.command('cumple', Birthday);
Bot.command(Commands.CUMPLEAÑOS, (ctx) => {
    if (ctx.admin)
        SopaDePata(ctx);
});
Bot.command(Commands.SOPADEPATA, (ctx) => {
    if (ctx.admin)
        SopaDePata(ctx);
});
Bot.command(Commands.BANK, Bank);
Bot.command(Commands.DEPOSIT, Deposit);
Bot.command(Commands.WITHDRAW, Withdraw);
Bot.command(Commands.ROB, Rob);
Bot.command(Commands.MULTAS, Multas);
Bot.command(Commands.PAY, Pay);
// // Bot.command(Commands.INVENTARIO, Inventario)
// Bot.command(Commands.TIENDAROB, ShopRob)
// Bot.command(Commands.COMPRAR, BuyRob)
Bot.command(Commands.CHEQUE, Cheque);
// Reload pending cheques on restart
import { getAllUnprocessedCheques, completeCheque } from "./db/cheque.js";
import { AddBalance } from "./db/mongodb.js";
getAllUnprocessedCheques().then(cheques => {
    for (const c of cheques) {
        const delay = new Date(c.completesAt).getTime() - Date.now();
        if (delay <= 0) {
            AddBalance(c.receiverId, c.amount);
            completeCheque(c._id.toString());
        }
        else {
            setTimeout(async () => {
                await AddBalance(c.receiverId, c.amount);
                await completeCheque(c._id.toString());
                Bot.sendMessage({
                    msg: null,
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
            msg: null,
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
cron.schedule('20 21 * * *', async () => {
    await resetAllDailyWithdraws();
    await resetAllDailyYappy();
    console.log('🔄 Límites diarios bancarios reiniciados.');
}, {
    timezone: 'America/Panama'
});
// ─── Casino schedule (Panama time) ─────────────────────────────────────────────
const CASINO_ANNOUNCEMENT = `🚨📢 *ANUNCIO OFICIAL* 📢🚨

🎰🔥 *¡EL CASINO VOLVIÓ!* 🔥🎰

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
async function getGroupJids() {
    try {
        const groups = await Bot.socket.groupFetchAllParticipating();
        return Object.keys(groups);
    }
    catch {
        return [];
    }
}
async function sendToAllGroups(content, mentions) {
    const jids = await getGroupJids();
    for (const jid of jids) {
        Bot.sendMessage({
            msg: null,
            jid,
            content,
            ...(mentions ? { mentions } : {}),
            delay: 1000,
        });
    }
}
// 8:00 PM — Announcement
cron.schedule('0 20 * * *', async () => {
    console.log('🎰 Enviando anuncio de casino (8 PM)...');
    await sendToAllGroups(CASINO_ANNOUNCEMENT);
}, {
    timezone: 'America/Panama'
});
// 8:30 PM — Casino opens + 20K bonus to all members
cron.schedule('30 20 * * *', async () => {
    console.log('🎰 Casino abierto (8:30 PM) — repartiendo bono de 20K...');
    const jids = await getGroupJids();
    for (const jid of jids) {
        try {
            const meta = await Bot.getGroupMetadata(jid);
            const participants = meta.participants.map(p => p.id);
            for (const pid of participants) {
                await AddBalance(pid, 20000);
            }
            Bot.sendMessage({
                msg: null,
                jid,
                content: `@all 🎰 *CASINO ABIERTO* 🎰\n\n🔥 El casino ya está disponible. ¡Suerte a todos!\n\n🎁 Se acreditaron $20,000 a todos los miembros.`,
                mentions: participants,
                delay: 1000,
            });
        }
        catch {
            // skip errors per group
        }
    }
}, {
    timezone: 'America/Panama'
});
// 8:40 PM — Casino closed
cron.schedule('40 20 * * *', async () => {
    console.log('🎰 Casino cerrado (8:40 PM)...');
    await sendToAllGroups('🚫 *CASINO CERRADO* 🚫\n\nEl casino ha cerrado por hoy. ¡Nos vemos en la próxima ronda!');
}, {
    timezone: 'America/Panama'
});
// 10:00 PM — Announcement + casino opens
cron.schedule('0 22 * * *', async () => {
    console.log('🎰 Casino abierto (10 PM)...');
    const jids = await getGroupJids();
    for (const jid of jids) {
        Bot.sendMessage({
            msg: null,
            jid,
            content: `🎰 *CASINO ABIERTO* 🎰\n\n🔥 Segunda ronda — el casino está disponible. ¡Aprovecha!`,
            delay: 1000,
        });
    }
}, {
    timezone: 'America/Panama'
});
// 10:10 PM — Casino closed
cron.schedule('10 22 * * *', async () => {
    console.log('🎰 Casino cerrado (10:10 PM)...');
    await sendToAllGroups('🚫 *CASINO CERRADO* 🚫\n\nEl casino ha cerrado por hoy. ¡Nos vemos en la próxima ronda!');
}, {
    timezone: 'America/Panama'
});
