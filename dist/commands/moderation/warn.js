import { Bot } from "../../core/core.js";
import { getMember, addWarn } from "../../db/mongodb.js";
async function execute(warn) {
    try {
        const user = await getMember(warn.jid);
        if (user) {
            addWarn(user._id, { id: user.warnings.length + 1, reason: warn.reason, timeStamp: new Date() }).then(() => {
                console.log('⚠ Advertencia Aplicada');
            });
            return '⚠ Advertencia Aplicada';
        }
        else {
            return 'No hay Registro';
        }
    }
    catch (error) {
        console.log(error);
        return 'Error al aplicar la advertencia';
    }
}
export async function Warn(ctx) {
    const mentioned = ctx.mentions[0];
    if (!mentioned)
        return;
    execute({
        reason: ctx.text.replace(/^(?:\S+\s+){2}/, ""),
        jid: mentioned,
    }).then(res => {
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: res,
            reply: true,
            delay: 1500
        });
    });
}
