import { Bot } from "../../core/core.js";
import { getMember } from "../../db/mongodb.js";
import { getOutstandingFine } from "../../db/criminal.js";
export async function Multas(ctx) {
    const send = (content) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });
    const userId = ctx.msg.key.participant;
    const targetId = ctx.mentions[0] ?? userId;
    // Only admins can view other users' fines
    const isSelf = userId === targetId;
    if (!isSelf && !ctx.admin) {
        return send("Solo los administradores pueden ver las multas de otros usuarios.");
    }
    const targetMember = await getMember(targetId);
    if (!targetMember) {
        return send("Usuario no encontrado.");
    }
    const outstanding = await getOutstandingFine(targetId);
    const lines = [
        `📋 *MULTAS PENDIENTES*`,
        ``,
        `👤 Usuario: ${targetMember.name}`,
        `💰 Multa pendiente: $${outstanding.toLocaleString('en-US')}`,
    ];
    if (outstanding > 0) {
        lines.push(``, `💡 Puedes pagar tus multas trabajando con !work.`, `💸 La multa se descuenta de tu wallet primero,`, `🏦 luego del banco, y si no alcanza, de tus ganancias.`);
    }
    else {
        lines.push(``, `✅ No tienes multas pendientes.`);
    }
    send(lines.join('\n'));
}
