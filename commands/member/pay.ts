import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import {
  getOutstandingFine,
  payFineFromWalletThenBank,
  reduceOutstandingFine,
  clearInteractionPenalty,
} from "../../db/criminal.js";

export async function Pay(ctx: CommandContext) {
  const send = (content: string) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });
  const userId = ctx.msg.key.participant as string;

  // Parse amount
  const arg = ctx.args[0]?.toLowerCase();
  if (!arg) {
    return send("Uso: !pay <cantidad> o !pay all");
  }

  const outstanding = await getOutstandingFine(userId);
  if (outstanding <= 0) {
    return send("✅ No tienes multas pendientes.");
  }

  const amount = arg === "all" ? outstanding : parseInt(arg);
  if (isNaN(amount) || amount <= 0) {
    return send("❌ Cantidad inválida.");
  }

  const toPay = Math.min(amount, outstanding);

  const { paidFromWallet, paidFromBank, remaining } = await payFineFromWalletThenBank(userId, toPay);
  const paid = paidFromWallet + paidFromBank;
  const actualRemaining = outstanding - paid;

  if (paid > 0) {
    await reduceOutstandingFine(userId, paid);
  }

  const lines: string[] = [];

  if (paidFromWallet > 0) {
    lines.push(`💰 Pagaste $${paidFromWallet.toLocaleString('en-US')} de tu wallet.`);
  }
  if (paidFromBank > 0) {
    lines.push(`🏦 Pagaste $${paidFromBank.toLocaleString('en-US')} de tu banco.`);
  }

  if (actualRemaining <= 0) {
    await clearInteractionPenalty(userId);
    lines.push(`✅ Multa pagada completamente! No tienes multas pendientes.`);
    return send(lines.join('\n'));
  }

  lines.push(`💸 Te falta pagar $${actualRemaining.toLocaleString('en-US')}.`);
  lines.push(`💡 Trabaja con !work para pagar el resto.`);

  if (paid === 0) {
    lines.unshift(`❌ No tienes suficiente dinero en wallet ni banco.`);
  }

  send(lines.join('\n'));
}
