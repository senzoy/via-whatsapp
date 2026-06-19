import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { createMatch, getOpenMatches } from "../../db/bets.js";
import { findCountry, COUNTRIES } from "../../assets/countries.js";

const COUNTRY_LIST = COUNTRIES.map((c) => `  • \`${c.code}\` — ${c.spanish} (${c.english})`).join("\n");

interface MatchPair {
  rawA: string;
  rawB: string;
}

function splitMatches(args: string[]): MatchPair[] | null {
  // Join args and split by ";"
  const text = args.join(" ");
  const parts = text.split(";").map((s) => s.trim()).filter(Boolean);

  if (parts.length === 0) return null;

  const pairs: MatchPair[] = [];
  for (const part of parts) {
    const tokens = part.split(/\s+/);
    const vsIndex = tokens.findIndex(
      (a) => a.toLowerCase() === "vs" || a.toLowerCase() === "versus"
    );

    if (vsIndex === -1 || vsIndex === 0 || vsIndex === tokens.length - 1) return null;

    const rawA = tokens.slice(0, vsIndex).join(" ");
    const rawB = tokens.slice(vsIndex + 1).join(" ");
    if (!rawA || !rawB) return null;

    pairs.push({ rawA, rawB });
  }

  return pairs;
}

export async function Partido(ctx: CommandContext) {
  const send = (content: string) =>
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 1500 });

  const args = ctx.args;
  if (args.length < 3) {
    return send(
      "❌ *Uso:* `!partido <equipo1> vs <equipo2>`\n\n" +
      "Ejemplo: `!partido mex vs arg`\n\n" +
      "También puedes crear varios separando con `;`:\n" +
      "`!partido mex vs arg ; usa vs esp ; sui vs col`\n\n" +
      "Países disponibles:\n" + COUNTRY_LIST
    );
  }

  const pairs = splitMatches(args);
  if (!pairs) {
    return send(
      "❌ *Formato incorrecto.* Usa:\n`!partido <equipo1> vs <equipo2>`\n\n" +
      "Ejemplo: `!partido mexico vs argentina`\n\n" +
      "Para varios: `!partido mex vs arg ; usa vs esp`"
    );
  }

  const created: { a: string; b: string; id: number }[] = [];
  const errors: string[] = [];
  const openMatches = await getOpenMatches(ctx.jid);

  for (const { rawA, rawB } of pairs) {
    const countryA = findCountry(rawA);
    const countryB = findCountry(rawB);

    if (!countryA) {
      errors.push(`❌ *"${rawA}"* no es un país conocido.`);
      continue;
    }
    if (!countryB) {
      errors.push(`❌ *"${rawB}"* no es un país conocido.`);
      continue;
    }
    if (countryA.code === countryB.code) {
      errors.push(`❌ *${rawA}* y *${rawB}* son el mismo país.`);
      continue;
    }

    const teamA = countryA.code.toUpperCase();
    const teamB = countryB.code.toUpperCase();
    const normA = teamA.toLowerCase();
    const normB = teamB.toLowerCase();

    const duplicate = openMatches.find(
      (m) =>
        (m.teamA === normA && m.teamB === normB) ||
        (m.teamA === normB && m.teamB === normA)
    );

    if (duplicate) {
      errors.push(`⚠️ *${teamA}* vs *${teamB}* ya existe (Partido #${duplicate.matchId}).`);
      continue;
    }

    const match = await createMatch(teamA, teamB, ctx.sender, ctx.jid);
    created.push({ a: teamA, b: teamB, id: match.matchId });
  }

  const lines: string[] = [];

  if (created.length > 0) {
    lines.push(`⚽ *PARTIDOS CREADOS*`, `─────────────────`);
    for (const m of created) {
      lines.push(`  🆔 #${m.id}  —  *${m.a}* vs *${m.b}*`);
    }
    lines.push(
      `─────────────────`,
      ``,
      `Usa \`!apuesto <equipo> gana\` para apostar.`,
    );
  }

  if (errors.length > 0) {
    if (lines.length > 0) lines.push(``);
    lines.push(...errors);
  }

  if (lines.length === 0) {
    lines.push("❌ No se pudo crear ningún partido.");
  }

  return send(lines.join("\n"));
}
