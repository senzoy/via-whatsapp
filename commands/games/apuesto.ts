import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { parseBet, formatBet, getTeamsFromBet } from "../../libs/betParser.js";
import {
  findMatchByTeam,
  getOpenMatches,
  resolveTeamInMatch,
  getUserBetForMatch,
  placeBet,
  type IMatch,
} from "../../db/bets.js";

const HELP_TEXT = [
  "⚽ *Uso de !apuesto:*",
  "",
  "📌 *Marcador exacto:*",
  "`!apuesto mex 1 sud 0`",
  "",
  "🏆 *Ganador:*",
  "`!apuesto mex gana`",
  "",
  "💀 *Perdedor:*",
  "`!apuesto mex pierde`",
  "",
  "⚖️ *Empate:*",
  "`!apuesto empate`",
  "",
  "📈 *Más de X goles:*",
  "`!apuesto mex > 2`",
  "",
  "📉 *Menos de X goles:*",
  "`!apuesto mex < 2`",
  "",
  "🔄 *Doble oportunidad:*",
  "`!apuesto mex o empate`",
].join("\n");

export async function Apuesto(ctx: CommandContext) {
  const userId = ctx.sender;
  const send = (content: string) =>
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 1500 });

  // ── Parse the bet ────────────────────────────────────────────────────────
  if (ctx.args.length === 0) {
    return send(HELP_TEXT);
  }

  const parsed = parseBet(ctx.args);
  if (!parsed) {
    return send(`❌ No entendí tu apuesta.\n\n${HELP_TEXT}`);
  }

  // ── Find the match ───────────────────────────────────────────────────────
  const group = ctx.jid;
  let match: IMatch | null = null;

  const teamsInBet = getTeamsFromBet(parsed);

  if (teamsInBet.length > 0) {
    // Try to find a match by the team mentioned
    const found = await findMatchByTeam(teamsInBet[0]!, group);
    if (found) {
      match = found.match;
    }
  } else {
    // For "empate" with no team — pick the only open match if there's exactly one
    const openMatches = await getOpenMatches(group);
    if (openMatches.length === 1) {
      match = openMatches[0]!.toObject();
    } else if (openMatches.length > 1) {
      const matchList = openMatches
        .map((m) => `  #${m.matchId}: ${m.teamA} vs ${m.teamB}`)
        .join("\n");
      return send(
        `⚠️ Hay ${openMatches.length} partidos abiertos. Especifica un equipo:\n\n${matchList}\n\nEjemplo: \`!apuesto mex o empate\``
      );
    }
  }

  if (!match) {
    return send("❌ No hay un partido abierto con ese equipo en este grupo.");
  }

  // ── Validate teams against the match ─────────────────────────────────────
  let betTeam: string | null = null;
  let betScoreA: number | null = null;
  let betScoreB: number | null = null;

  if (parsed.type === "exact_score") {
    // Resolve both teams
    const resolvedA = resolveTeamInMatch(match, parsed.teamA);
    const resolvedB = resolveTeamInMatch(match, parsed.teamB);

    if (!resolvedA || !resolvedB) {
      return send(
        `❌ No reconozco los equipos en este partido.\n` +
        `Partido #${match.matchId}: *${match.teamA}* vs *${match.teamB}*`
      );
    }

    if (resolvedA.side === resolvedB.side) {
      return send("❌ Mencionaste el mismo equipo dos veces.");
    }

    // Ensure scoreA corresponds to match.teamA and scoreB to match.teamB
    if (resolvedA.side === "A") {
      betScoreA = parsed.scoreA;
      betScoreB = parsed.scoreB;
    } else {
      betScoreA = parsed.scoreB;
      betScoreB = parsed.scoreA;
    }
  } else if (parsed.type !== "draw") {
    // All other types that reference a team
    const resolved = resolveTeamInMatch(match, parsed.team);
    if (!resolved) {
      return send(
        `❌ No reconozco ese equipo en el partido.\n` +
        `Partido #${match.matchId}: *${match.teamA}* vs *${match.teamB}*`
      );
    }
    betTeam = resolved.team;
  }

  // ── Check if user already bet on this match ──────────────────────────────
  const existingBet = await getUserBetForMatch(match.matchId, userId);
  if (existingBet) {
    return send(
      `⚠️ Ya tienes una apuesta registrada en el partido #${match.matchId} (*${match.teamA}* vs *${match.teamB}*).\n\n` +
      `No puedes apostar dos veces en el mismo partido.`
    );
  }

  // ── Place the bet ────────────────────────────────────────────────────────
  await placeBet(match.matchId, userId, {
    betType: parsed.type === "exact_score" ? "exact_score" : parsed.type,
    team: betTeam,
    scoreA: betScoreA,
    scoreB: betScoreB,
    threshold: "threshold" in parsed ? parsed.threshold : null,
  });

  // ── Format confirmation ──────────────────────────────────────────────────
  // Build a display-friendly version using canonical team names
  const displayBet = buildDisplayBet(parsed, match, betTeam);

  const lines = [
    `✅ *Apuesta registrada*`,
    `─────────────────`,
    `⚽ Partido #${match.matchId}: *${match.teamA}* vs *${match.teamB}*`,
    `🎯 Predicción: ${displayBet}`,
    `─────────────────`,
    `¡Buena suerte! 🍀`,
  ];

  // Delete the user's message for cleanliness
  Bot.socket.sendMessage(ctx.jid, { delete: ctx.msg.key });
  return send(lines.join("\n"));
}

/** Build a display-friendly bet string using canonical team names from the match */
function buildDisplayBet(parsed: ReturnType<typeof parseBet>, match: IMatch, betTeam: string | null): string {
  if (!parsed) return "?";

  switch (parsed.type) {
    case "draw":
      return "⚖️ *Empate*";
    case "exact_score":
      return `🎯 *${match.teamA}* ${parsed.scoreA} - *${match.teamB}* ${parsed.scoreB}`;
    case "over":
      return `📈 *${betTeam}* anota más de ${parsed.threshold} goles`;
    case "under":
      return `📉 *${betTeam}* anota menos de ${parsed.threshold} goles`;
    case "winner":
      return `🏆 *${betTeam}* gana`;
    case "loser":
      return `💀 *${betTeam}* pierde`;
    case "double_chance":
      return `🔄 *${betTeam}* gana o empate`;
  }
}
