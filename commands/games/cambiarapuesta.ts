import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getBetsByUser, getMatchesByIds, placeBet, resolveTeamInMatch } from "../../db/bets.js";
import { parseBet, getTeamsFromBet } from "../../libs/betParser.js";

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

  const allBets = await getBetsByUser(userId);
  const matchIds = [...new Set(allBets.map((b) => b.matchId))];
  const matches = await getMatchesByIds(matchIds);
  const matchMap = new Map(matches.map((m) => [m.matchId, m]));
  const openMatchIds = new Set(
    matches.filter((m) => m.status === "open").map((m) => m.matchId)
  );

  const activeBets = allBets.filter((b) => openMatchIds.has(b.matchId) && !b.changed);

  if (activeBets.length === 0) {
    return send("📋 No tienes apuestas activas para cambiar.");
  }

  if (ctx.args.length === 0) {
    const lines = [
      `📋 *CAMBIAR APUESTA*`,
      `─────────────────`,
    ];
    for (let i = 0; i < activeBets.length; i++) {
      const b = activeBets[i]!;
      const m = matchMap.get(b.matchId);
      if (!m) continue;
      lines.push(`#${i + 1} ${m.teamA.toUpperCase()} vs ${m.teamB.toUpperCase()} [🟢] ${formatBetShort(b)}`);
    }
    lines.push(
      `─────────────────`,
      `Usa: \`!cambiarapuesta <#> <nueva apuesta>\``,
      `Ej: \`!cambiarapuesta 1 mex gana\``,
    );
    return send(lines.join("\n"));
  }

  const index = Number(ctx.args[0]);
  if (!Number.isInteger(index) || index < 1 || index > activeBets.length) {
    return send(`❌ Número inválido. Usa un número entre 1 y ${activeBets.length}.`);
  }

  const selected = activeBets[index - 1]!;
  const match = matchMap.get(selected.matchId);
  if (!match) return send("❌ Partido no encontrado.");

  const newBetArgs = ctx.args.slice(1);
  if (newBetArgs.length === 0) {
    return send(
      `❌ Escribe la nueva apuesta también.\n` +
      `Ej: \`!cambiarapuesta ${index} ${match.teamA} gana\``
    );
  }

  const parsed = parseBet(newBetArgs);
  if (!parsed) {
    return send(`❌ No entendí la nueva apuesta. Ej: \`!cambiarapuesta ${index} ${match.teamA} gana\``);
  }

  const teamsInBet = getTeamsFromBet(parsed);
  for (const teamAlias of teamsInBet) {
    if (!resolveTeamInMatch(match, teamAlias)) {
      return send(`❌ *${teamAlias}* no juega en #${match.matchId} (*${match.teamA}* vs *${match.teamB}*).`);
    }
  }

  let betTeam: string | null = null;
  let betScoreA: number | null = null;
  let betScoreB: number | null = null;

  if (parsed.type === "exact_score") {
    const resolvedA = resolveTeamInMatch(match, parsed.teamA);
    const resolvedB = resolveTeamInMatch(match, parsed.teamB);
    if (!resolvedA || !resolvedB) {
      return send(`❌ Equipo no reconocido en #${match.matchId}.`);
    }
    if (resolvedA.side === resolvedB.side) {
      return send("❌ Mencionaste el mismo equipo dos veces.");
    }
    if (resolvedA.side === "A") {
      betScoreA = parsed.scoreA;
      betScoreB = parsed.scoreB;
    } else {
      betScoreA = parsed.scoreB;
      betScoreB = parsed.scoreA;
    }
  } else if (parsed.type !== "draw") {
    const resolved = resolveTeamInMatch(match, parsed.team);
    if (!resolved) {
      return send(`❌ *${parsed.team}* no juega en #${match.matchId}.`);
    }
    betTeam = resolved.team;
  }

  await selected.deleteOne();

  const newBet = await placeBet(match.matchId, userId, {
    betType: parsed.type,
    team: betTeam,
    scoreA: betScoreA,
    scoreB: betScoreB,
    threshold: "threshold" in parsed ? parsed.threshold : null,
  });
  newBet.changed = true;
  await newBet.save();

  return send(
    `✅ *Apuesta cambiada* 🎯\n` +
    `─────────────────\n` +
    `⚽ #${match.matchId}: *${match.teamA.toUpperCase()}* vs *${match.teamB.toUpperCase()}*\n` +
    `🆕 Nueva: ${formatBetShort(newBet)}\n` +
    `─────────────────\n` +
    `¡Buena suerte! 🍀`
  );
}
