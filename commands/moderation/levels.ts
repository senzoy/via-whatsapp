import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getTopMembersLvl } from "../../db/mongodb.js";
import { getLevel, getRank } from "../member/profile.js";


export async function Levels(ctx: CommandContext) {
    const members = (await getTopMembersLvl(ctx.jid)).map((user, index) => `${index + 1}. ${user.name} - ${user.level || 0}`)
        .join("\n");
    Bot.sendMessage({
        msg: ctx.msg,
        jid: ctx.jid,
        content: `✨TOP MIEMBROS ACTIVOS✨\n${members}`,
        reply: true,
        delay: 1500
    })
}