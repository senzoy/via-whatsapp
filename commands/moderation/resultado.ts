import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import {
  getMatchById,
  setMatchResult,
  evaluateBets,
  resolveTeamInMatch,
} from "../../db/bets.js";

export async function Resultado(ctx: CommandContext) {
  const send = (content: string) =>
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 1500 });

  // ── Parse: !resultado <matchId> <teamA> <scoreA> <teamB> <scoreB> ───────
  if (ctx.args.length < 5) {
    return send(
      "❌ *Uso:* `!resultado <id> <equipo1> <goles1> <equipo2> <goles2>`\n\n" +
      "Ejemplo: `!resultado 1 mex 2 sud 1`"
    );
  }

  const matchId = Number(ctx.args[0]);
  if (isNaN(matchId) || !Number.isInteger(matchId)) {
    return send("❌ El primer argumento debe ser el ID del partido.\n\nEjemplo: `!resultado 1 mex 2 sud 1`");
  }

  // ── Verify the match exists ──────────────────────────────────────────────
  const match = await getMatchById(matchId);
  if (!match) {
    return send(`❌ No se encontró el partido #${matchId}.`);
  }

  if (match.status === "finished") {
    return send(
      `⚠️ El partido #${matchId} ya tiene resultado: *${match.teamA}* ${match.scoreA} - *${match.teamB}* ${match.scoreB}`
    );
  }

  // ── Parse scores ─────────────────────────────────────────────────────────
  const teamArg1 = ctx.args[1]!;
  const score1 = Number(ctx.args[2]);
  const teamArg2 = ctx.args[3]!;
  const score2 = Number(ctx.args[4]);

  if (isNaN(score1) || isNaN(score2) || !Number.isInteger(score1) || !Number.isInteger(score2) || score1 < 0 || score2 < 0) {
    return send("❌ Los goles deben ser números enteros positivos.");
  }

  // ── Resolve teams ────────────────────────────────────────────────────────
  const matchObj = match.toObject();
  const resolved1 = resolveTeamInMatch(matchObj, teamArg1);
  const resolved2 = resolveTeamInMatch(matchObj, teamArg2);

  if (!resolved1 || !resolved2) {
    return send(
      `❌ No reconozco los equipos.\n` +
      `Partido #${matchId}: *${match.teamA}* vs *${match.teamB}*`
    );
  }

  if (resolved1.side === resolved2.side) {
    return send("❌ Mencionaste el mismo equipo dos veces.");
  }

  // Map scores to canonical positions (A = first team in match, B = second)
  let scoreA: number;
  let scoreB: number;
  if (resolved1.side === "A") {
    scoreA = score1;
    scoreB = score2;
  } else {
    scoreA = score2;
    scoreB = score1;
  }

  // ── Set result and evaluate bets ─────────────────────────────────────────
  await setMatchResult(matchId, scoreA, scoreB);
  const { winners, losers, match: finishedMatch } = await evaluateBets(matchId, scoreA, scoreB);

  // ── Build results summary ────────────────────────────────────────────────
  const totalBets = winners.length + losers.length;

  const lines = [
    `⚽ *RESULTADO FINAL*`,
    `─────────────────`,
    `🆔 Partido #${matchId}`,
    `🏟️ *${finishedMatch.teamA}* ${scoreA} — ${scoreB} *${finishedMatch.teamB}*`,
    `─────────────────`,
    ``,
    `📊 *Resumen de apuestas:*`,
    `Total: ${totalBets} apuestas`,
    `✅ Acertaron: ${winners.length}`,
    `❌ Fallaron: ${losers.length}`,
  ];

  if (winners.length > 0) {
    lines.push("", "🏆 *Ganadores:*");
    for (const w of winners) {
      const mention = w.userLib.split("@")[0];
      lines.push(`  ✅ @${mention} — ${formatBetType(w.betType, w)}`);
    }
  }

  if (losers.length > 0) {
    lines.push("", "💔 *Perdedores:*");
    for (const l of losers) {
      const mention = l.userLib.split("@")[0];
      lines.push(`  ❌ @${mention} — ${formatBetType(l.betType, l)}`);
    }
  }

  if (totalBets === 0) {
    lines.push("", "😴 Nadie apostó en este partido.");
  }

  // Collect all mentioned JIDs for mentions
  const allMentions = [...winners, ...losers].map((b) => b.userLib);

  Bot.sendMessage({
    msg: ctx.msg,
    jid: ctx.jid,
    content: lines.join("\n"),
    reply: true,
    delay: 2000,
    mentions: allMentions,
  });
}

/** Format a bet type into a readable Spanish string */
function formatBetType(betType: string, bet: any): string {
  switch (betType) {
    case "draw":
      return "Empate";
    case "exact_score":
      return `Marcador: ${bet.scoreA}-${bet.scoreB}`;
    case "winner":
      return `${bet.team} gana`;
    case "loser":
      return `${bet.team} pierde`;
    case "over":
      return `${bet.team} > ${bet.threshold}`;
    case "under":
      return `${bet.team} < ${bet.threshold}`;
    case "double_chance":
      return `${bet.team} o empate`;
    default:
      return betType;
  }
}
