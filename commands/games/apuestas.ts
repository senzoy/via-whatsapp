import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getBetCountsByGroup, getBetBreakdownByMatch } from "../../db/bets.js";

const TYPE_LABELS: Record<string, string> = {
  draw: "⚖️ Empate",
  exact_score: "🎯 Marcador exacto",
  winner: "🏆 Ganador",
  loser: "💀 Perdedor",
  over: "📈 Más de X",
  under: "📉 Menos de X",
  double_chance: "🔄 Doble oportunidad",
};

export async function Apuestas(ctx: CommandContext) {
  const send = (content: string) =>
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 1500 });

  // ── With matchId: detailed breakdown ──────────────────────────────────────
  if (ctx.args.length >= 1) {
    const matchId = Number(ctx.args[0]);
    if (isNaN(matchId) || !Number.isInteger(matchId)) {
      return send("❌ Debes especificar un ID de partido válido.\n\nEjemplo: `!apuestas 1`");
    }

    const breakdown = await getBetBreakdownByMatch(matchId);
    if (!breakdown) {
      return send(`❌ No se encontró el partido #${matchId}.`);
    }

    const { match, total, byTeam, byType } = breakdown;
    const statusIcon = match.status === "open" ? "🟢" : match.status === "closed" ? "🔴" : "✅";

    const lines = [
      `📊 *PARTIDO #${match.matchId}* — ${match.teamA.toUpperCase()} vs ${match.teamB.toUpperCase()} [${statusIcon}]`,
      `─────────────────`,
      `📈 *Total:* ${total} apuestas`,
    ];

    if (total > 0) {
      lines.push("", "*Por equipo:*");
      const teamALabel = match.teamA.toUpperCase();
      const teamBLabel = match.teamB.toUpperCase();
      const aCount = byTeam[match.teamA] ?? 0;
      const bCount = byTeam[match.teamB] ?? 0;
      const drawCount = byTeam["draw"] ?? 0;

      for (const [label, count] of [[teamALabel, aCount], [teamBLabel, bCount]] as const) {
        if (count > 0) {
          const pct = ((count / total) * 100).toFixed(0);
          lines.push(`  ${label}: ${count} (${pct}%)`);
        }
      }

      const drawPct = total > 0 ? ((drawCount / total) * 100).toFixed(0) : "0";
      lines.push(`  ⚖️ Empate: ${drawCount} (${drawPct}%)`);

      lines.push("", "*Por tipo:*");
      for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
        const label = TYPE_LABELS[type] ?? type;
        lines.push(`  ${label}: ${count}`);
      }
    }

    return send(lines.join("\n"));
  }

  // ── No args: summary of all open/closed matches ──────────────────────────
  const summaries = await getBetCountsByGroup(ctx.jid);

  if (summaries.length === 0) {
    return send("📊 No hay partidos activos en este grupo.");
  }

  const lines = [
    `📊 *APUESTAS ABIERTAS*`,
    `─────────────────`,
  ];

  let totalAll = 0;
  for (const s of summaries) {
    const icon = s.status === "open" ? "🟢" : "🔴";
    lines.push(`#${s.matchId}: ${s.teamA.toUpperCase()} vs ${s.teamB.toUpperCase()} — ${s.count} apuestas  ${icon}`);
    totalAll += s.count;
  }

  lines.push(
    `─────────────────`,
    `Total: ${totalAll} apuestas en ${summaries.length} partidos`,
  );

  if (summaries.length > 0) {
    lines.push("", `Usa \`!apuestas <id>\` para ver el desglose de un partido.`);
  }

  return send(lines.join("\n"));
}
