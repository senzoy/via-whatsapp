import { getMember, GetCooldown, UpdateCooldown, AddBalance } from "../../db/mongodb.js";
import { getJob } from "../../assets/jobs.js";
import { Bot } from "../../core/core.js";
export async function Work(ctx) {
    const userId = `${ctx.msg.key.participant}`;
    const user = await getMember(userId);
    const cd = await GetCooldown(userId, 'work');
    const now = Date.now();
    if (!cd || !user) {
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: `Buscando trabajo...\n Intentalo de nuevo en 1 minuto`,
            reply: true,
            delay: 2000
        });
        await UpdateCooldown(userId, 'work', 60000);
        return;
    }
    if (now >= cd.getTime()) {
        await UpdateCooldown(userId, 'work', 3600000);
        const job = getJob(user.level || 0);
        if (!job)
            return;
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: `*💼 Trabajo*\n${user.name} a trabajado como *${job.name}* y ha ganado *💵 $${job.salary.toLocaleString('en-US')}*`,
            reply: true,
            delay: 2000
        });
        await AddBalance(userId, job.salary);
    }
    else {
        const remaining = Math.ceil((cd.getTime() - now) / 1000);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: `No puedes trabajar. Espera ${minutes}m ${seconds}s`,
            reply: true,
            delay: 2000
        });
    }
}
