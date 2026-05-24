import { Bot } from "../../core/core.js";
import { getMember } from "../../db/mongodb.js";
export async function Kick(ctx) {
    const mentioned = ctx.mentions[0];
    if (!mentioned)
        return;
    const user = await getMember(mentioned);
    if (user) {
        await Bot.socket.groupParticipantsUpdate(ctx.jid, [mentioned], 'remove');
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: `💥 ${user.name} ha sido expulsado`,
            reply: false,
            delay: 1500
        });
        if (ctx.args[1]) {
            const time = Number(ctx.args[1]);
            if (typeof time === 'number') {
                Bot.getGroupMetadata(ctx.jid).then((data) => {
                    const participant = data.participants.find((participant) => participant.id === mentioned);
                    setTimeout(async () => {
                        try {
                            if (!participant?.phoneNumber)
                                return;
                            await Bot.socket.groupParticipantsUpdate(ctx.jid, [participant.phoneNumber], 'add');
                        }
                        catch (err) {
                            console.error('Error re-agregando usuario:', err);
                        }
                    }, 1000 * (60 * Number(ctx.args[1])) || 60000);
                });
            }
        }
    }
    else {
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: 'No Hay Registro',
            reply: true,
            delay: 1500
        });
    }
}
