import { Bot } from "../../core/core.js";
import { getMember } from "../../db/mongodb.js";
export async function Wallet(ctx) {
    const user = await getMember(ctx.msg.key.participant);
    if (!user) {
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: "Usuario no encontrado.",
            reply: true,
            delay: 2000
        });
        return;
    }
    if (!user.bank) {
        user.bank = {
            balance: 0,
            transactions: [],
        };
    }
    const balance = user.bank.balance || 0;
    Bot.sendMessage({
        msg: ctx.msg,
        jid: ctx.jid,
        content: `💵 $${(balance || 0).toLocaleString('en-US')}`,
        reply: true,
        delay: 2000
    });
}
