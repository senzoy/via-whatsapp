import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getInventory } from "../../db/criminal.js";
import { robItems } from "../../assets/items.js";

export async function Inventario(ctx: CommandContext) {
  const send = (content: string) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });
  const userId = ctx.msg.key.participant as string;

  const inv = await getInventory(userId);

  const lines: string[] = [
    `🎒 *INVENTARIO*`,
    ``,
  ];

  let hasItems = false;
  for (const item of robItems) {
    const count = inv[item.id] ?? 0;
    if (count > 0) {
      hasItems = true;
      lines.push(`• ${item.name} x${count}`);
    }
  }

  if (!hasItems) {
    lines.push(`No tienes items.`);
    lines.push(``);
  }

  lines.push(``, `📖 *Items disponibles:*`);
  for (const item of robItems) {
    lines.push(`• ${item.name} - $${item.price.toLocaleString('en-US')}`);
    lines.push(`  ${item.description}`);
  }

  send(lines.join('\n'));
}
