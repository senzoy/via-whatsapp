import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getMember } from "../../db/mongodb.js";
import { getOrCreateBanco, BancoModel, isFrozen } from "../../db/banco.js";
import { getAccountLimits } from "../../db/configs.js";
import { createCheque } from "../../db/cheque.js";

export async function Cheque(ctx: CommandContext) {
  const send = (content: string) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });
  const userId = ctx.msg.key.participant as string;

  const mentioned = ctx.mentions[0];
  if (!mentioned) {
    return send("Uso: !cheque @usuario <cantidad>");
  }

  const receiver = await getMember(mentioned);
  if (!receiver) {
    return send("Usuario no encontrado.");
  }

  const amount = Number(ctx.args[1]);
  if (!Number.isInteger(amount) || amount <= 0) {
    return send("Ingresa una cantidad válida mayor a 0.");
  }

  if (await isFrozen(userId)) {
    return send("❌ Tu cuenta bancaria está congelada. No puedes emitir cheques.");
  }

  const member = await getMember(userId);
  if (!member) return send("Usuario no encontrado.");

  const banco = await getOrCreateBanco(userId, member.level || 0);
  const limits = await getAccountLimits(member.level || 0, banco.accountType, banco.subscriptionUntil);

  if (amount > limits.maxTransfer) {
    return send(`❌ Límite por cheque: $${limits.maxTransfer.toLocaleString('en-US')}. Tu cuenta es ${limits.accountType}.`);
  }

  if (banco.balance < amount) {
    return send(`❌ No tienes suficiente saldo en el banco. Balance: $${banco.balance.toLocaleString('en-US')}.`);
  }

  // Deduct immediately
  await BancoModel.updateOne({ userId }, { $inc: { balance: -amount }, $set: { updatedAt: new Date() } });

  const completesAt = new Date(Date.now() + 15 * 60 * 1000);
  const cheque = await createCheque({
    senderId: userId,
    receiverId: mentioned,
    amount,
    jid: ctx.jid,
    completesAt,
  });

  // Schedule delivery
  setTimeout(async () => {
    const { AddBalance } = await import("../../db/mongodb.js");
    const { completeCheque } = await import("../../db/cheque.js");
    await AddBalance(mentioned, amount);
    await completeCheque(cheque._id.toString());
    Bot.sendMessage({
      msg: null as unknown as any,
      jid: ctx.jid,
      content: `✅ Cheque de $${amount.toLocaleString('en-US')} de @${userId.split('@')[0]} fue entregado a @${mentioned.split('@')[0]}.`,
      mentions: [userId, mentioned],
      delay: 1000,
    });
  }, 15 * 60 * 1000);

  send(`📝 Cheque emitido por $${amount.toLocaleString('en-US')} a favor de @${mentioned.split('@')[0]}.\n⏳ Los fondos serán entregados en 15 minutos.`);
}
