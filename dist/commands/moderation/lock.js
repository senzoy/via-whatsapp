import { Bot } from "../../core/core.js";
async function Lock(ctx) {
    Bot.socket.groupSettingUpdate(ctx.jid, 'announcement').then(() => {
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: '🔒 Grupo Bloqueado. Solo los Administradores Pueden Escribir.',
            reply: true,
            delay: 1500
        });
    }).catch(err => {
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: '❌ No puedo realizar esta acción',
            reply: true,
            delay: 1500
        });
    });
}
export { Lock };
