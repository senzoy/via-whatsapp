const pendingRobberies = new Map();
const recentlyRobbed = new Map();
export function addPending(victimId, data) {
    pendingRobberies.set(victimId, data);
}
export function removePending(victimId) {
    pendingRobberies.delete(victimId);
}
export function hasPending(victimId) {
    return pendingRobberies.has(victimId);
}
export function isRecentlyRobbed(victimId) {
    return recentlyRobbed.has(victimId);
}
function setRecentlyRobbed(victimId) {
    const existing = recentlyRobbed.get(victimId);
    if (existing)
        clearTimeout(existing);
    const timeout = setTimeout(() => recentlyRobbed.delete(victimId), 5 * 60 * 1000);
    recentlyRobbed.set(victimId, timeout);
}
export function checkRobResponse(userId, text) {
    const pending = pendingRobberies.get(userId);
    if (!pending)
        return false;
    const keywords = ['atrapado', 'rata', 'ladron'];
    const lower = text.toLowerCase().trim();
    if (!keywords.some(k => lower.includes(k)))
        return false;
    clearTimeout(pending.timeout);
    pendingRobberies.delete(userId);
    setRecentlyRobbed(userId);
    processCaught(pending);
    return true;
}
async function payAndDistribute(thiefId, victimId, totalFine) {
    const { getMember, AddBalance } = await import("../db/mongodb.js");
    const { payFineFromWalletThenBank, reduceOutstandingFine, addOutstandingFine } = await import("../db/criminal.js");
    const result = await payFineFromWalletThenBank(thiefId, totalFine);
    const paid = result.paidFromWallet + result.paidFromBank;
    const remaining = totalFine - paid;
    if (paid > 0) {
        const victimShare = Math.ceil(paid * 0.5);
        await AddBalance(victimId, victimShare);
        await reduceOutstandingFine(thiefId, paid);
    }
    if (remaining > 0) {
        await addOutstandingFine(thiefId, remaining);
    }
    return paid;
}
async function processCaught(pending) {
    const { Bot } = await import("../core/core.js");
    const { getMember, AddBalance } = await import("../db/mongodb.js");
    const { getOrCreateCriminal, addCriminalPoints, setRobCooldown, setWorkPenalty, incrementRobStats } = await import("../db/criminal.js");
    const criminal = await getOrCreateCriminal(pending.thiefId);
    let totalFine = pending.fine;
    const [thief, victim] = await Promise.all([getMember(pending.thiefId), getMember(pending.victimId)]);
    let rankMultiplier = false;
    if (thief && victim && (victim.level || 0) > (thief.level || 0)) {
        totalFine *= 2;
        rankMultiplier = true;
    }
    const paid = await payAndDistribute(pending.thiefId, pending.victimId, totalFine);
    const finalRemaining = totalFine - paid;
    const workPenaltyMs = getWorkPenaltyDuration(criminal.criminalPoints + 1);
    await Promise.all([
        setRobCooldown(pending.thiefId, 4 * 60 * 60 * 1000),
        setWorkPenalty(pending.thiefId, workPenaltyMs),
        addCriminalPoints(pending.thiefId, 1),
        incrementRobStats(pending.thiefId, false),
    ]);
    const lines = [
        `🚔 @${pending.victimId.split('@')[0]} atrapó a @${pending.thiefId.split('@')[0]} intentando robarle!`,
        ``,
        rankMultiplier ? `👑 La víctima es de rango superior. Multa duplicada.` : null,
        `💸 Multa total: -$${totalFine.toLocaleString('en-US')}`,
    ];
    if (paid > 0) {
        const victimShare = Math.ceil(paid * 0.5);
        lines.push(`💵 Pagaste al instante: $${paid.toLocaleString('en-US')}`);
        lines.push(`🔄 @${pending.victimId.split('@')[0]} recibió $${victimShare.toLocaleString('en-US')} de compensación`);
    }
    if (finalRemaining > 0) {
        lines.push(`📋 Multa pendiente: $${finalRemaining.toLocaleString('en-US')}`);
    }
    lines.push(`⛔ No podrás trabajar durante ${workPenaltyMs / 60 / 60 / 1000}h.`, `🕐 Cooldown de robo: 4h`, `📈 Puntos criminales: +1 (total: ${criminal.criminalPoints + 1})`);
    Bot.sendMessage({
        msg: null,
        jid: pending.jid,
        content: lines.filter(Boolean).join('\n'),
        mentions: [pending.thiefId, pending.victimId],
        delay: 1000,
    });
}
async function processCaughtByPolice(pending) {
    const { Bot } = await import("../core/core.js");
    const { getMember, AddBalance } = await import("../db/mongodb.js");
    const { getOrCreateCriminal, addCriminalPoints, setRobCooldown, setWorkPenalty, incrementRobStats, setBankYappyBlock } = await import("../db/criminal.js");
    const criminal = await getOrCreateCriminal(pending.thiefId);
    let totalFine = pending.fine;
    const [thief, victim] = await Promise.all([getMember(pending.thiefId), getMember(pending.victimId)]);
    let rankMultiplier = false;
    if (thief && victim && (victim.level || 0) > (thief.level || 0)) {
        totalFine *= 2;
        rankMultiplier = true;
    }
    const paid = await payAndDistribute(pending.thiefId, pending.victimId, totalFine);
    const finalRemaining = totalFine - paid;
    const workPenaltyMs = getWorkPenaltyDuration(criminal.criminalPoints + 1);
    const bankBlockMs = getBankBlockDuration(criminal.criminalPoints);
    await Promise.all([
        setRobCooldown(pending.thiefId, 4 * 60 * 60 * 1000),
        setWorkPenalty(pending.thiefId, workPenaltyMs),
        addCriminalPoints(pending.thiefId, 1),
        incrementRobStats(pending.thiefId, false),
        setBankYappyBlock(pending.thiefId, bankBlockMs),
    ]);
    const lines = [
        `🚨 @${pending.thiefId.split('@')[0]} fue atrapado por la policía!`,
        ``,
        rankMultiplier ? `👑 La víctima es de rango superior. Multa duplicada.` : null,
        `💸 Multa total: -$${totalFine.toLocaleString('en-US')}`,
    ];
    if (paid > 0) {
        const victimShare = Math.ceil(paid * 0.5);
        lines.push(`💵 Pagaste al instante: $${paid.toLocaleString('en-US')}`);
        lines.push(`🔄 @${pending.victimId.split('@')[0]} recibió $${victimShare.toLocaleString('en-US')} de compensación`);
    }
    if (finalRemaining > 0) {
        lines.push(`📋 Multa pendiente: $${finalRemaining.toLocaleString('en-US')}`);
    }
    lines.push(`🏦❌ Banco y Yappy bloqueados por ${bankBlockMs / 60 / 60 / 1000}h.`, `⛔ No podrás trabajar durante ${workPenaltyMs / 60 / 60 / 1000}h.`, `🕐 Cooldown de robo: 4h`, `📈 Puntos criminales: +1 (total: ${criminal.criminalPoints + 1})`);
    Bot.sendMessage({
        msg: null,
        jid: pending.jid,
        content: lines.filter(Boolean).join('\n'),
        mentions: [pending.thiefId, pending.victimId],
        delay: 1000,
    });
}
async function processSuccess(pending) {
    const { Bot } = await import("../core/core.js");
    const { AddBalance } = await import("../db/mongodb.js");
    const { setRobCooldown, incrementRobStats } = await import("../db/criminal.js");
    await Promise.all([
        AddBalance(pending.thiefId, pending.amount),
        AddBalance(pending.victimId, -pending.amount),
        setRobCooldown(pending.thiefId, 60 * 60 * 1000),
        incrementRobStats(pending.thiefId, true),
    ]);
    Bot.sendMessage({
        msg: null,
        jid: pending.jid,
        content: `🦹 @${pending.thiefId.split('@')[0]} robó exitosamente $${pending.amount.toLocaleString('en-US')} de la wallet de @${pending.victimId.split('@')[0]}.`,
        mentions: [pending.thiefId, pending.victimId],
        delay: 1000,
    });
}
export function scheduleSuccess(pending) {
    pending.timeout = setTimeout(() => {
        pendingRobberies.delete(pending.victimId);
        setRecentlyRobbed(pending.victimId);
        processSuccess(pending);
    }, 60 * 60 * 1000);
}
export function triggerPoliceCatch(pending) {
    clearTimeout(pending.timeout);
    pendingRobberies.delete(pending.victimId);
    setRecentlyRobbed(pending.victimId);
    processCaughtByPolice(pending);
}
function getWorkPenaltyDuration(points) {
    if (points >= 10)
        return 24 * 60 * 60 * 1000;
    if (points >= 5)
        return 8 * 60 * 60 * 1000;
    if (points >= 3)
        return 4 * 60 * 60 * 1000;
    return 2 * 60 * 60 * 1000;
}
function getBankBlockDuration(points) {
    if (points >= 6)
        return 8 * 60 * 60 * 1000;
    if (points >= 3)
        return 4 * 60 * 60 * 1000;
    return 2 * 60 * 60 * 1000;
}
