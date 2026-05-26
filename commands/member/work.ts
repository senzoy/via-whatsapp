import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getMember, GetCooldown, UpdateCooldown, AddBalance } from "../../db/mongodb.js";
import { getJob } from "../../assets/jobs.js";
import { getOrCreateCriminal, getOutstandingFine, payFineFromWalletThenBank } from "../../db/criminal.js";

export async function Work(ctx: CommandContext) {
  const userId = `${ctx.msg.key.participant}`;
  const send = (content: string) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });

  const user = await getMember(userId);
  if (!user) {
    send(`Buscando trabajo...\n Intentalo de nuevo en 1 minuto`);
    await UpdateCooldown(userId, 'work', 60000);
    return;
  }

  // Check work penalty from criminal record
  const criminal = await getOrCreateCriminal(userId);
  if (criminal.workPenaltyUntil && Date.now() < new Date(criminal.workPenaltyUntil).getTime()) {
    const remaining = Math.ceil((new Date(criminal.workPenaltyUntil).getTime() - Date.now()) / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    send(`⛔ Tienes una penalización laboral activa. No puedes trabajar. Espera ${minutes}m ${seconds}s`);
    return;
  }

  const cd = await GetCooldown(userId, 'work');
  const now = Date.now();
  if (cd && now < cd.getTime()) {
    const remaining = Math.ceil((cd.getTime() - now) / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    send(`No puedes trabajar. Espera ${minutes}m ${seconds}s`);
    return;
  }

  const job = getJob(user.level || 0);

  // Pay outstanding fine from wallet then bank BEFORE earning
  let finePaidFromWallet = 0;
  let finePaidFromBank = 0;
  let remainingFine = 0;
  const outstandingFine = await getOutstandingFine(userId);
  
  if (outstandingFine > 0) {
    const { paidFromWallet, paidFromBank, remaining } = await payFineFromWalletThenBank(userId, outstandingFine);
    finePaidFromWallet = paidFromWallet;
    finePaidFromBank = paidFromBank;
    remainingFine = remaining;
  }

  const netSalary = job.risk ? Math.max(0, job.salary - job.risk.fine) : job.salary;
  const totalEarned = netSalary;

  await Promise.all([
    AddBalance(userId, totalEarned),
    UpdateCooldown(userId, 'work', job.cooldown * 60 * 1000),
  ]);

  const lines: string[] = [
    `*💼 Trabajo*`,
    `${user.name} trabajó como *${job.name}*`,
  ];

  if (outstandingFine > 0) {
    lines.push(
      ``,
      `💰 Ganancia: $${totalEarned.toLocaleString('en-US')}`,
    );
    if (finePaidFromWallet > 0) {
      lines.push(`💸 Pagaste de wallet: -$${finePaidFromWallet.toLocaleString('en-US')}`);
    }
    if (finePaidFromBank > 0) {
      lines.push(`🏦 Pagaste del banco: -$${finePaidFromBank.toLocaleString('en-US')}`);
    }
    if (remainingFine > 0) {
      lines.push(`📋 Multa pendiente: $${remainingFine.toLocaleString('en-US')}`);
    }
    lines.push(`💵 Neto: $${(totalEarned - finePaidFromWallet - finePaidFromBank).toLocaleString('en-US')}`);
  } else if (job.risk) {
    lines.push(
      ``,
      `⚠️ *${job.risk.event.message}*`,
    );
    if (job.risk.fine > 0) {
      lines.push(`💸 Multa: -$${job.risk.fine.toLocaleString('en-US')}`);
    }
    lines.push(
      `💰 Neto: $${netSalary.toLocaleString('en-US')}`,
      `⏳ Cooldown: ${job.cooldown} min`,
    );
  } else {
    if (job.message) {
      lines.push(`📋 ${job.message('cliente')}`);
    }
    lines.push(
      ``,
      `✅ Trabajo completado`,
      `💰 Ganancia: $${job.salary.toLocaleString('en-US')}`,
      `⏳ Cooldown: ${job.cooldown} min`,
    );
  }

  send(lines.join('\n'));
}