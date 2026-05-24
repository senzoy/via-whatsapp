import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { MemberWarnings } from "../../db/mongodb.js";

export async function Warnings(ctx: CommandContext) {
  const member = ctx.msg.key.participant;
  const mentioned = ctx.mentions[0]
  console.log(member)
  const user = await MemberWarnings(mentioned ? mentioned : member || '', 'list', {})
  if (user && 'warnings' in user) {
    if (mentioned ? ctx.args[1] : ctx.args[0] === 'remove') {
      const value = mentioned ? ctx.args[2] : ctx.args[1]
      if (value === 'all') {
        await MemberWarnings(mentioned ? mentioned : member || '', 'remove', { warn: 'all' })
        return
      }
      if (Number(value)) {
        const index = Number(value)
        await MemberWarnings(mentioned ? mentioned : member || '', 'remove', { warn: index })
        return
      } else {
        Bot.sendMessage({
          msg: ctx.msg,
          jid: ctx.jid,
          content: 'comando incorrecto',
          reply: true,
          delay: 1500
        })
      }
    } else {
      const warningsList = user.warnings.map((warning, index) => `${index + 1}. razón: ${warning.reason}\n> hora: ${warning.timeStamp?.toLocaleDateString('es-PA')}`).join('\n')
      Bot.sendMessage({
        msg: ctx.msg,
        jid: ctx.jid,
        content: warningsList,
        reply: true,
        delay: 1500
      })
    }
  } else {
    Bot.sendMessage({
      msg: ctx.msg,
      jid: ctx.jid,
      content: 'No Hay Registro',
      reply: true,
      delay: 1500
    })
  }
}
