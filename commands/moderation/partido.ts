import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { createMatch, getOpenMatches } from "../../db/bets.js";
import { findCountry, COUNTRIES } from "../../assets/countries.js";

const COUNTRY_LIST = COUNTRIES.map((c) => `  • \`${c.code}\` — ${c.spanish} (${c.english})`).join("\n");

export async function Partido(ctx: CommandContext) {
  const send = (content: string) =>
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 1500 });

  // ── Parse: !partido <teamA> vs <teamB> ───────────────────────────────────
  const args = ctx.args;

  if (args.length < 3) {
    return send(
      "❌ *Uso:* `!partido <equipo1> vs <equipo2>`\n\n" +
      "Ejemplo: `!partido mex vs arg`\n\n" +
      "Países disponibles:\n" + COUNTRY_LIST
    );
  }

  // Find the "vs" separator
  const vsIndex = args.findIndex(
    (a) => a.toLowerCase() === "vs" || a.toLowerCase() === "versus"
  );

  if (vsIndex === -1 || vsIndex === 0 || vsIndex === args.length - 1) {
    return send(
      "❌ *Formato incorrecto.* Usa:\n`!partido <equipo1> vs <equipo2>`\n\n" +
      "Ejemplo: `!partido mexico vs argentina`"
    );
  }

  const rawA = args.slice(0, vsIndex).join(" ");
  const rawB = args.slice(vsIndex + 1).join(" ");

  if (!rawA || !rawB) {
    return send("❌ Debes especificar dos equipos.");
  }

  // ── Resolve teams to country codes ───────────────────────────────────────
  const countryA = findCountry(rawA);
  const countryB = findCountry(rawB);

  if (!countryA) {
    return send(
      `❌ *"${rawA}"* no corresponde a ningún país conocido.\n\n` +
      "Usa el código, el nombre en inglés o en español.\n" +
      "Ejemplo: \`!partido mexico vs argentina\`\n\n" +
      "Países disponibles:\n" + COUNTRY_LIST
    );
  }

  if (!countryB) {
    return send(
      `❌ *"${rawB}"* no corresponde a ningún país conocido.\n\n` +
      "Usa el código, el nombre en inglés o en español.\n" +
      "Ejemplo: \`!partido mexico vs argentina\`\n\n" +
      "Países disponibles:\n" + COUNTRY_LIST
    );
  }

  if (countryA.code === countryB.code) {
    return send("❌ Los equipos no pueden ser el mismo país.");
  }

  const teamA = countryA.code.toUpperCase();
  const teamB = countryB.code.toUpperCase();

  // ── Check for existing open matches with same teams ──────────────────────
  const openMatches = await getOpenMatches(ctx.jid);
  const normA = teamA.toLowerCase();
  const normB = teamB.toLowerCase();

  const duplicate = openMatches.find(
    (m) =>
      (m.teamA === normA && m.teamB === normB) ||
      (m.teamA === normB && m.teamB === normA)
  );

  if (duplicate) {
    return send(
      `⚠️ Ya existe un partido abierto entre *${duplicate.teamA}* vs *${duplicate.teamB}* (#${duplicate.matchId}).`
    );
  }

  // ── Create the match ─────────────────────────────────────────────────────
  const match = await createMatch(teamA, teamB, ctx.sender, ctx.jid);

  const lines = [
    `⚽ *PARTIDO CREADO*`,
    `─────────────────`,
    `🆔 Partido #${match.matchId}`,
    `🏟️ *${match.teamA.toUpperCase()}* vs *${match.teamB.toUpperCase()}*`,
    `📋 Estado: 🟢 Abierto`,
    `─────────────────`,
    ``,
    `Los usuarios ya pueden apostar con:`,
    `\`!apuesto ${match.teamA} gana\``,
    `\`!apuesto empate\``,
    `\`!apuesto ${match.teamA} 2 ${match.teamB} 1\``,
    ``,
    `Para cerrar apuestas: \`!cerrarpartido ${match.matchId}\``,
  ];

  return send(lines.join("\n"));
}
