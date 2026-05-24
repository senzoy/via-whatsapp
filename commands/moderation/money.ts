import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getTopMoney } from "../../db/mongodb.js";

export async function MoneyTop(ctx: CommandContext) {
    const list = await getTopMoney()

    if (!list) return;
    let text = "🎯 *Top Money*\n\n"

    list.forEach((member, index) => {
        const balance = member.bank?.balance;
        text += `_${index + 1}. ${member.name} 💵 - $${balance?.toLocaleString('en-US')}_\n`
    })

    Bot.sendMessage({
        msg: ctx.msg,
        jid: ctx.jid,
        content: text,
        reply: false,
        delay: 1000
    })
}