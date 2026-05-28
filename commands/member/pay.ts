import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { AddBalance, getMember } from "../../db/mongodb.js";
import {
  getOutstandingFine,
  payFineFromWalletThenBank,
  reduceOutstandingFine,
  clearInteractionPenalty,
} from "../../db/criminal.js";
import { getPendingLoans, getLoansTotalDue, reduceLoanBalance, payLoan } from "../../db/loans.js";
import { isFrozen } from "../../db/banco.js";
import { addToBankFund } from "../../db/configs.js";

async function payLoans(ctx: CommandContext, userId: string, send: Function) {
  const pendingLoans = await getPendingLoans(userId);
  if (pendingLoans.length === 0) {
    return send("✅ No tienes préstamos pendientes.");
  }

  const totalDue = pendingLoans.reduce((sum, l) => sum + l.remainingBalance, 0);

  // Parse amount: !pay loan <amount> or !pay loan all
  const rawArg = ctx.args[1]?.toLowerCase();
  let amountToPay: number;
  if (!rawArg || rawArg === 'all') {
    amountToPay = totalDue;
  } else {
    amountToPay = parseInt(rawArg);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      return send("❌ Cantidad inválida.");
    }
  }

  amountToPay = Math.min(amountToPay, totalDue);

  const member = await getMember(userId);
  const walletBalance = member?.bank?.balance ?? 0;
  let remaining = amountToPay;
  let paidFromWallet = 0;
  let paidFromBank = 0;

  if (walletBalance > 0) {
    paidFromWallet = Math.min(walletBalance, remaining);
    await AddBalance(userId, -paidFromWallet);
    remaining -= paidFromWallet;
  }

  const frozen = await isFrozen(userId);
  if (remaining > 0 && !frozen) {
    const { BancoModel } = await import("../../db/banco.js");
    const bancoDoc = await BancoModel.findOne({ userId }).select('balance');
    const bankBalance = bancoDoc?.balance ?? 0;
    if (bankBalance > 0) {
      paidFromBank = Math.min(bankBalance, remaining);
      await BancoModel.updateOne({ userId }, { $inc: { balance: -paidFromBank }, $set: { updatedAt: new Date() } });
      remaining -= paidFromBank;
    }
  }

  const totalPaid = paidFromWallet + paidFromBank;
  if (totalPaid > 0) {
    await addToBankFund(totalPaid);
  }

  // Apply payment to oldest loans first
  let toAllocate = totalPaid;
  for (const loan of pendingLoans) {
    if (toAllocate <= 0) break;
    const paymentForThis = Math.min(loan.remainingBalance, toAllocate);
    await reduceLoanBalance(loan._id.toString(), paymentForThis);
    toAllocate -= paymentForThis;
  }

  const newTotalDue = await getLoansTotalDue(userId);

  const lines: string[] = [];
  if (paidFromWallet > 0) lines.push(`💰 Pagaste $${paidFromWallet.toLocaleString('en-US')} de tu wallet.`);
  if (paidFromBank > 0) lines.push(`🏦 Pagaste $${paidFromBank.toLocaleString('en-US')} de tu banco.`);

  if (newTotalDue <= 0) {
    lines.push(`✅ Todos tus préstamos están pagados!`);
  } else {
    lines.push(`📋 Saldo restante de préstamos: $${newTotalDue.toLocaleString('en-US')}`);
  }

  if (totalPaid === 0) {
    lines.unshift(`❌ No tienes suficiente dinero en wallet ni banco.`);
  }

  send(lines.join('\n'));
}

async function payFine(userId: string, amount: number, send: Function) {
  const outstanding = await getOutstandingFine(userId);
  if (outstanding <= 0) {
    return send("✅ No tienes multas pendientes.");
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

export async function Pay(ctx: CommandContext) {
  const send = (content: string) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });
  const userId = ctx.msg.key.participant as string;

  const arg = ctx.args[0]?.toLowerCase();
  if (!arg) {
    return send("Uso: !pay <cantidad> | !pay all | !pay loan [cantidad]");
  }

  if (arg !== 'loan' && arg !== 'prestamo' && await isFrozen(userId)) {
    return send("❌ Tu cuenta bancaria está congelada. No puedes pagar multas mientras esté congelada.");
  }

  if (arg === 'loan' || arg === 'prestamo') {
    return payLoans(ctx, userId, send);
  }

  // Pay fine
  const outstanding = await getOutstandingFine(userId);
  if (outstanding <= 0) {
    // No fine, check if they have loans
    const loanTotal = await getLoansTotalDue(userId);
    if (loanTotal > 0) {
      return send(`No tienes multas, pero tienes préstamos pendientes. Usa !pay loan para pagarlos.`);
    }
    return send("✅ No tienes multas pendientes.");
  }

  const amount = arg === "all" ? outstanding : parseInt(arg);
  if (isNaN(amount) || amount <= 0) {
    return send("❌ Cantidad inválida.");
  }

  return payFine(userId, amount, send);
}
