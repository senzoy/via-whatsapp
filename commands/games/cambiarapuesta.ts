import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getBetsByUser, getMatchesByIds, getUserChangedBetForMatch, placeBet } from "../../db/bets.js";

function formatBetShort(bet: { betType: string; team: string | null; scoreA?: number | null; scoreB?: number | null; threshold?: number | null }): string {
  switch (bet.betType) {
    case "draw": return "⚖️ Empate";
    case "exact_score": return `${bet.scoreA}-${bet.scoreB}`;
    case "winner": return `${bet.team?.toUpperCase()} gana`;
    case "loser": return `${bet.team?.toUpperCase()} pierde`;
    case "over": return `${bet.team?.toUpperCase()} > ${bet.threshold}`;
    case "under": return `${bet.team?.toUpperCase()} < ${bet.threshold}`;
    case "double_chance": return `${bet.team?.toUpperCase()} o empate`;
    default: return "";
  }
}

export async function CambiarApuesta(ctx: CommandContext) {
  const send = (content: string) =>
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 1500 });

  const userId = ctx.sender;

  // ── Get user's active bets (open matches only) ─────────────────────────
  const allBets = await getBetsByUser(userId);
  const matchIds = [...new Set(allBets.map((b) => b.matchId))];
  const matches = await getMatchesByIds(matchIds);
  const openMatchIds = new Set(
    matches.filter((m) => m.status === "open").map((m) => m.matchId)
  );

  const activeBets = allBets.filter((b) => openMatchIds.has(b.matchId) && !b.changed);

  if (activeBets.length === 0) {
    return send("📋 No tienes apuestas activas para cambiar.");
  }

  // Build match map for display
  const matchMap = new Map(matches.map((m) => [m.matchId, m]));

  // ── If no index arg, show list ─────────────────────────────────────────
  if (ctx.args.length === 0) {
    const lines = [
      `📋 *CAMBIAR APUESTA*`,
      `─────────────────`,
    ];

    for (let i = 0; i < activeBets.length; i++) {
      const b = activeBets[i]!;
      const match = matchMap.get(b.matchId);
      if (!match) continue;
      const teams = `${match.teamA.toUpperCase()} vs ${match.teamB.toUpperCase()}`;
      lines.push(`#${i + 1} ${teams} [🟢] ${formatBetShort(b)}`);
    }

    lines.push(
      `─────────────────`,
      `Usa: \`!cambiarapuesta <#>\``,
      `Ej: \`!cambiarapuesta 1\``,
      ``,
      `Luego puedes apostar de nuevo con \`!apuesto\``,
    );

    return send(lines.join("\n"));
  }

  // ── Cancel selected bet ───────────────────────────────────────────────
  const index = Number(ctx.args[0]);
  if (!Number.isInteger(index) || index < 1 || index > activeBets.length) {
    return send(`❌ Número inválido. Usa un número entre 1 y ${activeBets.length}.`);
  }

  const selected = activeBets[index - 1]!;
  const match = matchMap.get(selected.matchId);
  if (!match) return send("❌ Partido no encontrado.");

  // Check if already changed
  const alreadyChanged = await getUserChangedBetForMatch(selected.matchId, userId);
  if (alreadyChanged) {
    return send(`⚠️ Ya cambiaste tu apuesta en el partido #${selected.matchId} (*${match.teamA.toUpperCase()}* vs *${match.teamB.toUpperCase()}*). Solo se permite un cambio por partido.`);
  }

  // Mark as changed
  selected.changed = true;
  await (selected as any).save();

  return send(
    `✅ Apuesta #${index} cancelada en el partido #${selected.matchId} (*${match.teamA.toUpperCase()}* vs *${match.teamB.toUpperCase()}*).\n\n` +
    `Ahora puedes apostar de nuevo con \`!apuesto\``
  );
}
