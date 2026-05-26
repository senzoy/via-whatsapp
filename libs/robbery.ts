import type { WAMessage } from "baileys";

interface PendingRobbery {
  thiefId: string;
  victimId: string;
  amount: number;
  fine: number;
  jid: string;
  timeout: NodeJS.Timeout;
}

const pendingRobberies = new Map<string, PendingRobbery>();

export function addPending(victimId: string, data: PendingRobbery) {
  pendingRobberies.set(victimId, data);
}

export function removePending(victimId: string) {
  pendingRobberies.delete(victimId);
}

export function hasPending(victimId: string): boolean {
  return pendingRobberies.has(victimId);
}

export function checkRobResponse(userId: string, text: string): boolean {
  const pending = pendingRobberies.get(userId);
  if (!pending) return false;

  const keywords = ['atrapado', 'rata', 'ladron'];
  const lower = text.toLowerCase().trim();
  if (!keywords.some(k => lower.includes(k))) return false;

  clearTimeout(pending.timeout);
  pendingRobberies.delete(userId);

  processCaught(pending);
  return true;
}

async function processCaught(pending: PendingRobbery) {
  const { Bot } = await import("../core/core.js");
  const { getMember, AddBalance } = await import("../db/mongodb.js");
  const { getOrCreateCriminal, addCriminalPoints, addOutstandingFine, setRobCooldown, setWorkPenalty, incrementRobStats } = await import("../db/criminal.js");

  const criminal = await getOrCreateCriminal(pending.thiefId);

  let totalFine = pending.fine;

  const [thief, victim] = await Promise.all([getMember(pending.thiefId), getMember(pending.victimId)]);

  let rankMultiplier = false;
  if (thief && victim && (victim.level || 0) > (thief.level || 0)) {
    totalFine *= 2;
    rankMultiplier = true;
  }

  const workPenaltyMs = getWorkPenaltyDuration(criminal.criminalPoints + 1);

  await Promise.all([
    addOutstandingFine(pending.thiefId, totalFine),
    setRobCooldown(pending.thiefId, 4 * 60 * 60 * 1000),
    setWorkPenalty(pending.thiefId, workPenaltyMs),
    addCriminalPoints(pending.thiefId, 1),
    incrementRobStats(pending.thiefId, false),
  ]);

  const lines = [
    `🚔 @${pending.victimId.split('@')[0]} atrapó a @${pending.thiefId.split('@')[0]} intentando robarle!`,
    ``,
    `💸 Multa: -$${totalFine.toLocaleString('en-US')}`,
    rankMultiplier ? `👑 La víctima es de rango superior. Multa duplicada.` : null,
    `⛔ No podrás trabajar durante ${workPenaltyMs / 60 / 60 / 1000}h.`,
    `🕐 Cooldown de robo: 4h`,
    `📈 Puntos criminales: +1 (total: ${criminal.criminalPoints + 1})`,
  ].filter(Boolean).join('\n');

  Bot.sendMessage({
    msg: null as unknown as WAMessage,
    jid: pending.jid,
    content: lines,
    mentions: [pending.thiefId, pending.victimId],
    delay: 1000,
  });
}

async function processSuccess(pending: PendingRobbery) {
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
    msg: null as unknown as WAMessage,
    jid: pending.jid,
    content: `🦹 @${pending.thiefId.split('@')[0]} robó exitosamente $${pending.amount.toLocaleString('en-US')} de la wallet de @${pending.victimId.split('@')[0]}.`,
    mentions: [pending.thiefId, pending.victimId],
    delay: 1000,
  });
}

export function scheduleSuccess(pending: PendingRobbery) {
  pending.timeout = setTimeout(() => {
    pendingRobberies.delete(pending.victimId);
    processSuccess(pending);
  }, 60 * 60 * 1000);
}

function getWorkPenaltyDuration(points: number): number {
  if (points >= 10) return 24 * 60 * 60 * 1000;
  if (points >= 5) return 8 * 60 * 60 * 1000;
  if (points >= 3) return 4 * 60 * 60 * 1000;
  return 2 * 60 * 60 * 1000;
}
