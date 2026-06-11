import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { closeMatch, getMatchById, getOpenMatches } from "../../db/bets.js";

export async function CerrarPartido(ctx: CommandContext) {
  const send = (content: string) =>
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 1500 });

  let matchId: number | null = null;

  if (ctx.args.length >= 1) {
    // !cerrarpartido <id>
    matchId = Number(ctx.args[0]);
    if (isNaN(matchId) || !Number.isInteger(matchId)) {
      return send("❌ El ID del partido debe ser un número.\n\nUso: `!cerrarpartido 1`");
    }
  } else {
    // No ID — try to find the only open match
    const openMatches = await getOpenMatches(ctx.jid);
    if (openMatches.length === 0) {
      return send("❌ No hay partidos abiertos en este grupo.");
    }
    if (openMatches.length > 1) {
      const list = openMatches
        .map((m) => `  #${m.matchId}: ${m.teamA} vs ${m.teamB}`)
        .join("\n");
      return send(
        `⚠️ Hay ${openMatches.length} partidos abiertos. Especifica el ID:\n\n${list}\n\nUso: \`!cerrarpartido <id>\``
      );
    }
    matchId = openMatches[0]!.matchId;
  }

  // ── Verify the match exists and is open ──────────────────────────────────
  const match = await getMatchById(matchId);
  if (!match) {
    return send(`❌ No se encontró el partido #${matchId}.`);
  }

  if (match.status === "closed") {
    return send(`⚠️ El partido #${matchId} ya está cerrado (apuestas bloqueadas).`);
  }

  if (match.status === "finished") {
    return send(`⚠️ El partido #${matchId} ya finalizó.`);
  }

  // ── Close it ─────────────────────────────────────────────────────────────
  await closeMatch(matchId);

  const lines = [
    `🔒 *APUESTAS CERRADAS*`,
    `─────────────────`,
    `🆔 Partido #${match.matchId}`,
    `🏟️ *${match.teamA}* vs *${match.teamB}*`,
    `📋 Estado: 🔴 Cerrado`,
    `─────────────────`,
    ``,
    `Ya no se aceptan más apuestas.`,
    `Para ingresar el resultado: \`!resultado ${match.matchId} ${match.teamA} 0 ${match.teamB} 0\``,
  ];

  return send(lines.join("\n"));
}
