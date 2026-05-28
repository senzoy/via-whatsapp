import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getMember, AddBalance } from "../../db/mongodb.js";
import { getOrCreateBanco, checkAndResetDaily, BancoModel, isFrozen } from "../../db/banco.js";
import { getPendingLoans, getLoansTotalDue } from "../../db/loans.js";

function parseAmount(str?: string): number | null {
  if (!str) return null;
  if (str.toLowerCase() === 'all' || str.toLowerCase() === 'max') return -1;
  const num = parseInt(str.replace(/[^0-9]/g, ''));
  if (isNaN(num) || num <= 0) return null;
  return num;
}

export async function Bank(ctx: CommandContext) {
  const userId = ctx.msg.key.participant as string;
  const send = (content: string) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });

  const member = await getMember(userId);
  if (!member) return send("Usuario no encontrado.");

  const account = await getOrCreateBanco(userId, member.level || 0);
  const updated = await checkAndResetDaily(userId);
  if (!updated) return send("Error al acceder al banco.");

  const availableSpace = Math.max(0, account.maxBalance - account.balance);
  const remainingDaily = account.dailyWithdrawLimit - updated.dailyWithdrawUsed;
  const lastTxns = account.transactions.slice(-5).reverse().map(t =>
    `${t.type === 'deposit' ? '+' : '-'}$${t.amount.toLocaleString('en-US')} → $${t.balanceAfter.toLocaleString('en-US')}`
  ).join('\n');

  const pendingLoans = await getPendingLoans(userId);
  const totalLoanDue = pendingLoans.reduce((sum, l) => sum + l.remainingBalance, 0);

  const frozenStatus = account.isFrozen ? '❌ CONGELADA' : '✅ Activa';
  const content = [
    `🏦 *BANCO*`,
    ``,
    `💰 Balance: $${account.balance.toLocaleString('en-US')}`,
    `📋 Tipo: ${account.accountType.toUpperCase()}`,
    `🔐 Estado: ${frozenStatus}`,
    `🔒 Límite máximo: $${account.maxBalance.toLocaleString('en-US')}`,
    `💳 Límite diario: $${account.dailyWithdrawLimit.toLocaleString('en-US')}`,
    `📤 Retirado hoy: $${updated.dailyWithdrawUsed.toLocaleString('en-US')}`,
    `📦 Espacio disponible: $${availableSpace.toLocaleString('en-US')}`,
    `💸 Límite restante hoy: $${Math.max(0, remainingDaily).toLocaleString('en-US')}`,
  ];

  if (totalLoanDue > 0) {
    content.push(``, `📋 *PRÉSTAMOS PENDIENTES*`);
    for (const loan of pendingLoans) {
      const dueStr = new Date(loan.dueAt).toLocaleDateString('es-PA', { timeZone: 'America/Panama' });
      const timeLeft = Math.ceil((new Date(loan.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      content.push(
        `• Préstamo #${loan._id.toString().slice(-6)}: $${loan.remainingBalance.toLocaleString('en-US')}`,
        `  Vence: ${dueStr} (${timeLeft > 0 ? `${timeLeft}d` : '⚠️ vencido'})`,
      );
    }
    content.push(``, `💡 Usa !pay loan para pagar tus préstamos.`);
  }

  const output = content.join('\n');

  send(output);
}

export async function Deposit(ctx: CommandContext) {
  const userId = ctx.msg.key.participant as string;
  const send = (content: string) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });

  if (await isFrozen(userId)) {
    return send("❌ Tu cuenta bancaria está congelada. No puedes realizar movimientos.");
  }

  const { isBankYappyBlocked } = await import("../../db/criminal.js");
  if (await isBankYappyBlocked(userId)) {
    return send("🔒 No puedes usar el banco porque fuiste atrapado por la policía intentando robar.");
  }

  const { hasPending } = await import("../../libs/robbery.js");
  if (hasPending(userId)) {
    return send("🔒 No puedes depositar mientras estás siendo robado.");
  }

  const member = await getMember(userId);
  if (!member) return send("Usuario no encontrado.");

  const walletBalance = member.bank?.balance || 0;
  const rawAmount = parseAmount(ctx.args[0]);
  if (rawAmount === null) return send("Usa: !deposit <cantidad> o !deposit all");

  const account = await getOrCreateBanco(userId, member.level || 0);
  const availableSpace = Math.max(0, account.maxBalance - account.balance);

  let depositAmount = rawAmount;
  if (rawAmount === -1) {
    depositAmount = Math.min(walletBalance, availableSpace);
  }

  if (depositAmount <= 0) {
    if (walletBalance <= 0) return send("No tienes dinero en tu wallet para depositar.");
    return send(`No hay espacio disponible en tu banco. Límite: $${account.maxBalance.toLocaleString('en-US')}`);
  }

  if (walletBalance < depositAmount) return send(`Saldo insuficiente. Tu wallet tiene $${walletBalance.toLocaleString('en-US')}`);
  if (depositAmount > availableSpace) return send(`Límite excedido. Espacio disponible: $${availableSpace.toLocaleString('en-US')}`);

  const newBalance = account.balance + depositAmount;

  await Promise.all([
    AddBalance(userId, -depositAmount),
    BancoModel.updateOne(
      { userId },
      {
        $inc: { balance: depositAmount },
        $push: {
          transactions: {
            $each: [{ type: 'deposit', amount: depositAmount, date: new Date(), balanceAfter: newBalance }],
            $slice: -20
          }
        },
        $set: { updatedAt: new Date() }
      }
    )
  ]);

  send(`✅ *Depósito exitoso*\n💵 Depositaste: $${depositAmount.toLocaleString('en-US')}\n💰 Nuevo balance: $${newBalance.toLocaleString('en-US')}`);
}

export async function Withdraw(ctx: CommandContext) {
  const userId = ctx.msg.key.participant as string;
  const send = (content: string) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });

  if (await isFrozen(userId)) {
    return send("❌ Tu cuenta bancaria está congelada. No puedes realizar movimientos.");
  }

  const { isBankYappyBlocked } = await import("../../db/criminal.js");
  if (await isBankYappyBlocked(userId)) {
    return send("🔒 No puedes usar el banco porque fuiste atrapado por la policía intentando robar.");
  }

  const { hasPending } = await import("../../libs/robbery.js");
  if (hasPending(userId)) {
    return send("🔒 No puedes retirar mientras estás siendo robado.");
  }

  const member = await getMember(userId);
  if (!member) return send("Usuario no encontrado.");

  const rawAmount = parseAmount(ctx.args[0]);
  if (rawAmount === null) return send("Usa: !withdraw <cantidad> o !withdraw all");

  await getOrCreateBanco(userId, member.level || 0);
  const account = await checkAndResetDaily(userId);
  if (!account) return send("Error al acceder al banco.");

  const remainingDaily = account.dailyWithdrawLimit - account.dailyWithdrawUsed;

  let withdrawAmount = rawAmount;
  if (rawAmount === -1) {
    withdrawAmount = Math.min(account.balance, remainingDaily);
  }

  if (withdrawAmount <= 0) {
    if (account.balance <= 0) return send("No tienes fondos en el banco.");
    return send(`Límite diario alcanzado. Te quedan $${Math.max(0, remainingDaily).toLocaleString('en-US')} para retirar hoy.`);
  }

  if (account.balance < withdrawAmount) return send(`Saldo insuficiente. Tu banco tiene $${account.balance.toLocaleString('en-US')}`);
  if (withdrawAmount > remainingDaily) return send(`Límite diario excedido. Te quedan $${Math.max(0, remainingDaily).toLocaleString('en-US')} para retirar hoy.`);

  const newBalance = account.balance - withdrawAmount;

  await Promise.all([
    AddBalance(userId, withdrawAmount),
    BancoModel.updateOne(
      { userId },
      {
        $inc: { balance: -withdrawAmount, dailyWithdrawUsed: withdrawAmount },
        $push: {
          transactions: {
            $each: [{ type: 'withdraw', amount: withdrawAmount, date: new Date(), balanceAfter: newBalance }],
            $slice: -20
          }
        },
        $set: { updatedAt: new Date() }
      }
    )
  ]);

  send(`✅ *Retiro exitoso*\n💵 Retiraste: $${withdrawAmount.toLocaleString('en-US')}\n💰 Nuevo balance: $${newBalance.toLocaleString('en-US')}`);
}
