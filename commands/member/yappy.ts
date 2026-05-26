import { Bot } from "../../core/core.js"
import type { CommandContext } from "../../libs/types.js"
import { getMember } from "../../db/mongodb.js"
import { BancoModel, getOrCreateBanco, checkAndResetYappyDaily, getAccountLimits } from "../../db/banco.js"

export async function Yappy(ctx: CommandContext) {
  const { isBankYappyBlocked } = await import("../../db/criminal.js");
  const { hasPending } = await import("../../libs/robbery.js");

  const userId = ctx.msg.key.participant as string;
  if (await isBankYappyBlocked(userId)) {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: "🔒 No puedes usar Yappy porque fuiste atrapado por la policía intentando robar.",
      reply: true,
      delay: 1500,
    });
    return;
  }

  if (hasPending(userId)) {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: "🔒 No puedes enviar Yappy mientras estás siendo robado.",
      reply: true,
      delay: 1500,
    });
    return;
  }

  const mentioned = ctx.mentions[0] || ''
  if (!mentioned) {
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content: "Debes mencionar a un usuario.", reply: true, delay: 1500 });
    return;
  }

  const [sender, receiver] = await Promise.all([getMember(userId), getMember(mentioned)]);
  if (!sender || !receiver) {
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content: "Usuario no encontrado.", reply: true, delay: 1500 });
    return;
  }

  const amount = Number(ctx.args[1])
  if (!Number.isInteger(amount) || amount <= 0) {
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content: "Ingresa una cantidad válida mayor a 0.", reply: true, delay: 1500 });
    return;
  }

  const banco = await getOrCreateBanco(userId, sender.level || 0);
  const limits = getAccountLimits(sender.level || 0);

  if (amount > limits.yappyLimit) {
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content: `Límite por transferencia: $${limits.yappyLimit.toLocaleString('en-US')}.`, reply: true, delay: 1500 });
    return;
  }

  const updated = await checkAndResetYappyDaily(userId);
  if (!updated) {
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content: "Error al acceder al banco.", reply: true, delay: 1500 });
    return;
  }

  const dailyRemaining = limits.yappyLimit * 10 - updated.yappyDailyUsed;
  if (amount > dailyRemaining) {
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content: `Límite diario alcanzado. Te quedan $${Math.max(0, dailyRemaining).toLocaleString('en-US')}.`, reply: true, delay: 1500 });
    return;
  }

  if (banco.balance < amount) {
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content: `No tienes suficiente saldo en el banco. Balance: $${banco.balance.toLocaleString('en-US')}.`, reply: true, delay: 1500 });
    return;
  }

  await Promise.all([
    BancoModel.updateOne({ userId }, { $inc: { balance: -amount, yappyDailyUsed: amount }, $set: { updatedAt: new Date() } }),
  ]);

  const { AddBalance } = await import("../../db/mongodb.js");
  await AddBalance(mentioned, amount);

  Bot.sendMessage({
    msg: ctx.msg,
    jid: ctx.jid,
    content: `
      *🟠🔵 Yappy* 📱

      *De:* ${sender.name}
      *Para:* ${receiver.name}
      *Monto:* 💵 $${amount.toLocaleString('en-us')}
      `,
    reply: true,
    delay: 1500
  });
}
