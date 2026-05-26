import { Bot } from "../../core/core.js"
import type { CommandContext } from "../../libs/types.js"
import { getMember, Transfer } from "../../db/mongodb.js"

export async function Yappy(ctx: CommandContext) {
  const { isBankYappyBlocked } = await import("../../db/criminal.js");

  const userId = ctx.msg.key.participant as string;
  if (await isBankYappyBlocked(userId)) {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: "🔒 No puedes usar Yappy porque fuiste atrapado por la policía intentando robar.",
      reply: true,
      delay: 1500,
    });
    return;
  }

  const mentioned = ctx.mentions[0] || ''
  const sender = await getMember(userId)
  const receiver = await getMember(mentioned)

  if (!sender || !receiver) {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: "No se pudo encontrar los usuarios, intenta de nuevo",
      reply: true,
      delay: 1500
    })
    return
  }

  const amount = Number(ctx.args[1])

  if (!Number.isInteger(amount) || amount <= 0) {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: "Por favor, ingresa una cantidad válida mayor a 0",
      reply: true,
      delay: 1500
    })
    return
  }
  if (amount > sender.bank!.balance!) {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: "No tienes suficiente saldo para realizar esta transaccion",
      reply: true,
      delay: 1500
    })
    return
  }
  Transfer(sender.lib!, receiver.lib!, amount).then(() => {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: `
      *🟠🔵 Yappy* 📱

      *De:* ${sender.name}
      *Para:* ${receiver.name}
      *Monto:* 💵 $${amount.toLocaleString('en-us')}
      `,
      reply: true,
      delay: 1500
    })
  }).catch(() => {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: "No se pudo enviar el dinero, intenta de nuevo",
      reply: true,
      delay: 1500
    })
  })
}