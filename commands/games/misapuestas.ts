import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getBetsByUser, getMatchesByIds, type IMatch, type IBet } from "../../db/bets.js";

function formatBetShort(bet: IBet, match: IMatch): string {
  switch (bet.betType) {
    case "draw":
      return "⚖️ Empate";
    case "exact_score":
      return `${bet.scoreA}-${bet.scoreB}`;
    case "winner":
      return `${bet.team?.toUpperCase()} gana`;
    case "loser":
      return `${bet.team?.toUpperCase()} pierde`;
    case "over":
      return `${bet.team?.toUpperCase()} > ${bet.threshold}`;
    case "under":
      return `${bet.team?.toUpperCase()} < ${bet.threshold}`;
    case "double_chance":
      return `${bet.team?.toUpperCase()} o empate`;
  }
}

function formatStatus(match: IMatch): string {
  if (match.status === "open") return "🟢";
  if (match.status === "closed") return "🔴";
  return `✅ ${match.scoreA}-${match.scoreB}`;
}

function formatResult(bet: IBet): string {
  if (bet.result === "won") return "✅";
  if (bet.result === "lost") return "❌";
  return "⏳";
}

export async function MisApuestas(ctx: CommandContext) {
  const send = (content: string) =>
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 1500 });

  const bets = await getBetsByUser(ctx.sender);
  if (bets.length === 0) {
    return send("📋 No tienes apuestas registradas.");
  }

  const matchIds = [...new Set(bets.map((b) => b.matchId))];
  const matches = await getMatchesByIds(matchIds);
  const matchMap = new Map<number, IMatch>();
  for (const m of matches) {
    matchMap.set(m.matchId, m.toObject());
  }

  const lines = [
    `📋 *TUS APUESTAS*`,
    `─────────────────`,
  ];

  for (const b of bets) {
    const match = matchMap.get(b.matchId);
    if (!match) {
      lines.push(`#${b.matchId}: [❌ Eliminado]`);
      continue;
    }

    const status = formatStatus(match);
    const betText = formatBetShort(b, match);
    const result = formatResult(b);
    const suffix = match.status === "finished" || match.status === "closed" ? ` → ${result}` : "";

    lines.push(`#${match.matchId} ${match.teamA.toUpperCase()} vs ${match.teamB.toUpperCase()} [${status}] ${betText}${suffix}`);
  }

  lines.push(
    `─────────────────`,
    `${bets.length} apuestas`,
  );

  return send(lines.join("\n"));
}
