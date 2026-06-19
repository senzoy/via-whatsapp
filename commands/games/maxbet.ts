import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getMaxbetRanking } from "../../db/bets.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export async function Maxbet(ctx: CommandContext) {
  const send = (content: string) =>
    Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 1500 });

  const ranking = await getMaxbetRanking(ctx.jid);

  if (ranking.length === 0) {
    return send("📊 No hay datos de apuestas en este grupo.");
  }

  const lines = [
    `🏆 *RANKING MAXBET*`,
    `─────────────────`,
  ];

  for (let i = 0; i < ranking.length; i++) {
    const entry = ranking[i]!;
    const icon = MEDALS[i] ?? `#${i + 1}`;
    lines.push(`${icon} ${entry.name}  —  ${entry.points} pts`);
  }

  lines.push(
    `─────────────────`,
    `Total: ${ranking.length} participantes`,
  );

  return send(lines.join("\n"));
}
