import { Bot } from "../../core/core.js";
import { getMember } from "../../db/mongodb.js";
import { getVerifyUser, setVerified } from "../../db/verify.js";
export async function Verify(ctx) {
    const deletemsg = Bot.socket.sendMessage(ctx.jid, { delete: ctx.msg.key });
    const token = ctx.args[0];
    if (!token) {
        deletemsg;
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: `*Por favor proporciona un token para verificar*`,
            delay: 1000
        });
        return;
    }
    const user = await getVerifyUser(token);
    if (!user) {
        deletemsg;
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: `*Token inválido ❌*`,
            delay: 1000
        });
        return;
    }
    if (user.discord?.authenticated) {
        deletemsg;
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: `*El usuario ya se encuentra verificado*`,
            delay: 1000
        });
        return;
    }
    const member = await getMember(ctx.sender);
    if (!member) {
        deletemsg;
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: `*Usuario no registrado ❌*`,
            delay: 1000
        });
        return;
    }
    member.discordId = user.discord?.id;
    member.discordTag = user.discord?.tag;
    await member.save();
    await setVerified(token);
    deletemsg;
    Bot.sendMessage({
        msg: ctx.msg,
        jid: ctx.jid,
        content: `*Verificado correctamente ✔*`,
        delay: 1000
    });
}
