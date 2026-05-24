import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getTopMembers } from "../../db/mongodb.js";

export async function Top(ctx: CommandContext) {
  const members = await (await getTopMembers(ctx.jid)).map((user, index) => `${index + 1}. ${user.name} - ${user.points} pts`)
    .join("\n");
  Bot.sendMessage({
    msg: ctx.msg,
    jid: ctx.jid,
    content: `✨TOP MIEMBROS ACTIVOS✨\n${members}`,
    reply: true,
    delay: 1500
  })
}
