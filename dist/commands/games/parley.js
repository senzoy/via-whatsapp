import { Bot } from "../../core/core.js";
import { getMember, AddBalance } from "../../db/mongodb.js";
import { findTicketByCode, linkTicketToUser } from "../../db/parley.js";
import mongoose from "mongoose";
export async function Parley(ctx) {
    const userId = ctx.msg.key.participant;
    const send = (content) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });
    const ticketCode = (ctx.args[0] || '').replace(/^#/, '').toUpperCase();
    if (!ticketCode)
        return send("❌ Usa: !parley #CODIGO");
    const member = await getMember(userId);
    if (!member)
        return send("❌ Usuario no encontrado.");
    let ticket;
    try {
        ticket = await findTicketByCode(ticketCode);
    }
    catch (e) {
        console.error("[Parley] Error buscando ticket:", e);
        return send("❌ Error al buscar el ticket en la base de datos.");
    }
    if (!ticket)
        return send("❌ Ticket no encontrado.");
    if (ticket.userLib && ticket.userLib !== member.lib) {
        return send("❌ Este ticket ya está vinculado a otro usuario.");
    }
    const wager = ticket.wager || 0;
    const walletBalance = member.bank?.balance || 0;
    const levelBalance = member.level || 0;
    let statusMsg = '';
    if (ticket.userLib && ticket.userLib === member.lib) {
        statusMsg = '✅ *Ticket ya pagado anteriormente*';
    }
    else {
        if (walletBalance >= wager) {
            try {
                await AddBalance(member.lib, -wager);
                statusMsg = `✅ *Pago exitoso* — $${wager.toLocaleString('en-US')} descontado de wallet`;
            }
            catch (e) {
                console.error("[Parley] Error deducting wallet:", e);
                return send("❌ Error al procesar el pago desde wallet.");
            }
        }
        else if (levelBalance >= wager) {
            try {
                await mongoose.model('Member').updateOne({ lib: member.lib }, { $inc: { level: -wager } });
                statusMsg = `✅ *Pago exitoso* — ${wager.toLocaleString('en-US')} niveles descontados`;
            }
            catch (e) {
                console.error("[Parley] Error deducting level:", e);
                return send("❌ Error al procesar el pago con niveles.");
            }
        }
        else {
            return send(`❌ *Saldo insuficiente*\n\n` +
                `Necesitas: $${wager.toLocaleString('en-US')} en wallet o ${wager.toLocaleString('en-US')} niveles.\n` +
                `Tienes: $${walletBalance.toLocaleString('en-US')} en wallet y ${levelBalance.toLocaleString('en-US')} niveles.`);
        }
        try {
            await linkTicketToUser(ticket._id.toString(), member.lib);
        }
        catch (e) {
            console.error("[Parley] Error linking ticket:", e);
            return send("❌ Error al vincular el ticket.");
        }
    }
    const resultEmoji = ticket.result === 'won' ? '✅' : ticket.result === 'lost' ? '❌' : '⏳';
    const payoutStr = ticket.actualPayout
        ? `$${Number(ticket.actualPayout).toLocaleString('en-US')}`
        : 'Pendiente';
    const lines = [
        `🎫 *PARLEY #${ticket.ticketCode}*`,
        `─────────────────`,
        `📌 Título: ${ticket.title || 'Sin título'}`,
        `💰 Apuesta: $${wager.toLocaleString('en-US')}`,
        `📈 Odds: ${ticket.odds || '-'}x`,
        `💵 Pago potencial: $${(ticket.potentialPayout || 0).toLocaleString('en-US')}`,
        `🏆 Resultado: ${resultEmoji} ${payoutStr}`,
        `─────────────────`,
        statusMsg,
    ];
    lines.push(`─────────────────`);
    if (ticket.conditions?.length > 0) {
        lines.push(`📋 *Condiciones:*`);
        ticket.conditions.forEach((c, i) => {
            const op = c.operator || '';
            const val = c.value ?? '';
            const condOdds = c.odds ? ` @${c.odds}x` : '';
            const condStatus = c.status === 'won' ? '✅' : c.status === 'lost' ? '❌' : '⏳';
            const actualVal = c.actualValue != null ? ` (real: ${c.actualValue})` : '';
            lines.push(`${i + 1}️⃣ ${c.targetName || '?'} — ${c.metric || '?'} ${op} ${val}${condOdds}`);
            lines.push(`   Estado: ${condStatus}${actualVal}`);
        });
        lines.push(`─────────────────`);
    }
    lines.push(`🆔 Ticket: #${ticket.ticketCode}`);
    return send(lines.join('\n'));
}
