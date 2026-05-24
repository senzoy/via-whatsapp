import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getMember } from "../../db/mongodb.js";

export async function Points(ctx: CommandContext) {
    const mentioned = ctx.mentions[0] || ctx.msg.key.participant
    if (mentioned) {
        const user = await getMember(mentioned)
        if (user) {
            Bot.sendMessage({
                msg: ctx.msg,
                jid: ctx.jid,
                content: `*Puntos de ${user.name}* ${user.level?.toLocaleString('en-us')}`,
                reply: true,
                delay: 1500
            })
        }
    }
}