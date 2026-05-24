import { Bot } from "../../core/core.js";
import type { CommandContext } from "../../libs/types.js";
import { GetAllBirthdays } from "../../db/mongodb.js";


export async function SopaDePata(ctx: CommandContext) {
    const monthNames = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];

    const date = new Date();
    let month = date.getMonth() + 1;
    let isCurrentMonth = true;

    if (ctx.args.length > 0) {
        const arg = ctx.args[0].toLowerCase();
        const parsedMonth = parseInt(arg, 10);
        if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
            month = parsedMonth;
            isCurrentMonth = false;
        } else {
            const index = monthNames.findIndex(m => m === arg || m.startsWith(arg.substring(0, 3)));
            if (index !== -1) {
                month = index + 1;
                isCurrentMonth = false;
            }
        }
    }

    const monthName = monthNames[month - 1];
    const title = isCurrentMonth
        ? '*🎉 Cumpleañeros de este mes*\n\n'
        : `*🎉 Cumpleañeros de ${monthName}*\n\n`;

    const birthdays = await GetAllBirthdays();
    let output = title;
    let hasBirthdays = false;

    birthdays.forEach((birthday: any) => {
        if (birthday.birthday?.month === month) {
            output += ` ${birthday.birthday.day < 10 ? '0' + birthday.birthday.day : birthday.birthday.day} - @${birthday.name}\n`;
            hasBirthdays = true;
        }
    });

    if (!hasBirthdays) {
        output = isCurrentMonth
            ? 'No es cumpleaños de nadie este mes'
            : `No hay cumpleaños registrados en ${monthName}`;
    }

    Bot.sendMessage({
        msg: ctx.msg,
        jid: ctx.jid,
        content: output,
        delay: 1500,
        reply: true
    });
}