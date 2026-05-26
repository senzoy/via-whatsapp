import { Bot } from "../../core/core.js";
import { getMember, GetCooldown, UpdateCooldown, AddBalance } from "../../db/mongodb.js";
import { getJob } from "../../assets/jobs.js";
import { getOrCreateCriminal, getOutstandingFine, payFineFromWalletThenBank, checkAndGetPenaltyStatus, clearInteractionPenalty, setOutstandingFine } from "../../db/criminal.js";
export async function Work(ctx) {
    const userId = `${ctx.msg.key.participant}`;
    const send = (content) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });
    const user = await getMember(userId);
    if (!user) {
        send(`Buscando trabajo...\n Intentalo de nuevo en 1 minuto`);
        await UpdateCooldown(userId, 'work', 60000);
        return;
    }
    // Check work penalty
    const criminal = await getOrCreateCriminal(userId);
    if (criminal.workPenaltyUntil && Date.now() < new Date(criminal.workPenaltyUntil).getTime()) {
        const remaining = Math.ceil((new Date(criminal.workPenaltyUntil).getTime() - Date.now()) / 1000);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        send(`⛔ Tienes una penalización laboral activa. No puedes trabajar. Espera ${minutes}m ${seconds}s`);
        return;
    }
    // Check interaction penalty (48h deadline expired)
    const penalty = await checkAndGetPenaltyStatus(userId);
    if (penalty.blocked) {
        send(penalty.message);
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
    // Try to pay outstanding fine (wallet → bank)
    let finePaidFromWallet = 0;
    let finePaidFromBank = 0;
    let remainingFine = 0;
    const outstandingFine = await getOutstandingFine(userId);
    if (outstandingFine > 0) {
        const result = await payFineFromWalletThenBank(userId, outstandingFine);
        finePaidFromWallet = result.paidFromWallet;
        finePaidFromBank = result.paidFromBank;
        remainingFine = result.remaining;
    }
    // Calculate earnings
    const grossSalary = job.risk ? Math.max(0, job.salary - job.risk.fine) : job.salary;
    // Force deduct remaining fine from earnings
    let deductedFromEarnings = 0;
    let netEarnings = grossSalary;
    if (remainingFine > 0) {
        deductedFromEarnings = Math.min(remainingFine, grossSalary);
        netEarnings = grossSalary - deductedFromEarnings;
        remainingFine = remainingFine - deductedFromEarnings;
    }
    // Update outstanding fine
    const totalPaid = finePaidFromWallet + finePaidFromBank + deductedFromEarnings;
    if (totalPaid > 0) {
        const newFine = Math.max(0, outstandingFine - totalPaid);
        await setOutstandingFine(userId, newFine);
        if (newFine <= 0) {
            await clearInteractionPenalty(userId);
        }
    }
    await Promise.all([
        AddBalance(userId, netEarnings),
        UpdateCooldown(userId, 'work', job.cooldown * 60 * 1000),
    ]);
    const lines = [
        `*💼 Trabajo*`,
        `${user.name} trabajó como *${job.name}*`,
    ];
    if (totalPaid > 0) {
        lines.push(``, `💰 Ganancia bruta: $${grossSalary.toLocaleString('en-US')}`);
        if (finePaidFromWallet > 0)
            lines.push(`💸 Pagaste de wallet: -$${finePaidFromWallet.toLocaleString('en-US')}`);
        if (finePaidFromBank > 0)
            lines.push(`🏦 Pagaste del banco: -$${finePaidFromBank.toLocaleString('en-US')}`);
        if (deductedFromEarnings > 0)
            lines.push(`📉 Descontado de ganancias: -$${deductedFromEarnings.toLocaleString('en-US')}`);
        if (remainingFine > 0)
            lines.push(`📋 Multa pendiente: $${remainingFine.toLocaleString('en-US')}`);
        lines.push(`💵 Neto recibido: $${netEarnings.toLocaleString('en-US')}`);
    }
    else if (job.risk) {
        lines.push(``, `⚠️ *${job.risk.event.message}*`);
        if (job.risk.fine > 0)
            lines.push(`💸 Multa: -$${job.risk.fine.toLocaleString('en-US')}`);
        lines.push(`💰 Neto: $${netEarnings.toLocaleString('en-US')}`, `⏳ Cooldown: ${job.cooldown} min`);
    }
    else {
        if (job.message)
            lines.push(`📋 ${job.message('cliente')}`);
        lines.push(``, `✅ Trabajo completado`, `💰 Ganancia: $${grossSalary.toLocaleString('en-US')}`, `⏳ Cooldown: ${job.cooldown} min`);
    }
    send(lines.join('\n'));
}
