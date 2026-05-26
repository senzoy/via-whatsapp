import { Bot } from "../../core/core.js";
import { getInventory } from "../../db/criminal.js";
import { robItems } from "../../assets/items.js";
export async function Inventario(ctx) {
    const send = (content) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });
    const userId = ctx.msg.key.participant;
    const inv = await getInventory(userId);
    const lines = [
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
