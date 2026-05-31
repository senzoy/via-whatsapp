import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getMember, AddBalance } from "../../db/mongodb.js";
import { findTicketByCode, linkTicketToUser } from "../../db/parley.js";
import mongoose from "mongoose";

export async function Parley(ctx: CommandContext) {
  const userId = ctx.msg.key.participant as string;
  const send = (content: string) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });

  const ticketCode = (ctx.args[0] || '').replace(/^#/, '').toUpperCase();
  if (!ticketCode) return send("❌ Usa: !parley #CODIGO");

  const member = await getMember(userId);
  if (!member) return send("❌ Usuario no encontrado.");

  const ticket = await findTicketByCode(ticketCode);
  if (!ticket) return send("❌ Ticket no encontrado.");

  if (ticket.userLib && ticket.userLib !== member.lib) {
    return send("❌ Este ticket ya está vinculado a otro usuario.");
  }

  const wager = ticket.wager || 0;
  const walletBalance = member.bank?.balance || 0;
  const pointsBalance = member.points || 0;

  let deductedFrom = '';

  if (!ticket.userLib) {
    if (walletBalance >= wager) {
      await AddBalance(member.lib, -wager);
      deductedFrom = 'wallet';
    } else if (pointsBalance >= wager) {
      await mongoose.model('Member').updateOne(
        { lib: member.lib },
        { $inc: { points: -wager } }
      );
      deductedFrom = 'points';
    } else {
      return send(
        `❌ *Saldo insuficiente*\n\n` +
        `Necesitas: $${wager.toLocaleString('en-US')} en wallet o ${wager.toLocaleString('en-US')} puntos.\n` +
        `Tienes: $${walletBalance.toLocaleString('en-US')} en wallet y ${pointsBalance.toLocaleString('en-US')} puntos.`
      );
    }

    await linkTicketToUser(ticket._id.toString(), member.lib);
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
    deductedFrom === 'wallet' ? `💳 Pagado desde wallet` : deductedFrom === 'points' ? `⭐ Pagado con puntos` : ``,
    `🏆 Resultado: ${resultEmoji} ${payoutStr}`,
  ].filter(Boolean);

  if (ticket.conditions?.length > 0) {
    lines.push(`─────────────────`, `*Condiciones:*`);
    ticket.conditions.forEach((c: any, i: number) => {
      const op = c.operator || '';
      const val = c.value ?? '';
      const condOdds = c.odds ? ` @${c.odds}x` : '';
      const condStatus = c.status === 'won' ? '✅' : c.status === 'lost' ? '❌' : '⏳';
      const actualVal = c.actualValue != null ? ` (real: ${c.actualValue})` : '';
      lines.push(`${i + 1}️⃣ ${c.targetName || '?'} — ${c.metric || '?'} ${op} ${val}${condOdds}`);
      lines.push(`   Estado: ${condStatus}${actualVal}`);
    });
  }

  lines.push(`─────────────────`, `🆔 Ticket: #${ticket.ticketCode}`);

  return send(lines.join('\n'));
}
