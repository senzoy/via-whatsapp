import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";

function Unlock(ctx: CommandContext) {
  Bot.socket.groupSettingUpdate(ctx.jid, 'not_announcement').then(() => {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: '🔓 Grupo Desbloqueado. Todos Pueden Escribir.',
      reply: true,
      delay: 1500
    })
  }).catch(err => {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: '❌ No puedo realizar esta acción',
      reply: true,
      delay: 1500
    })
  })
}

export { Unlock }