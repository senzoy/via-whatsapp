import { Bot } from "../../core/core.js";
import { getMember, UpdateBirthday } from "../../db/mongodb.js";
// Meses (inglés + español)
const months = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
    // Español
    ene: 1, enero: 1,
    febr: 2, febrero: 2,
    marz: 3, marzo: 3,
    abr: 4, abril: 4,
    may: 5, mayo: 5,
    jun: 6, junio: 6,
    jul: 7, julio: 7,
    ago: 8, agosto: 8,
    sept: 9, septiembre: 9,
    octu: 10, octubre: 10,
    novi: 11, noviembre: 11,
    dici: 12, diciembre: 12,
};
function parseDate(input) {
    input = input.toLowerCase().trim();
    // 1. DD/MM
    let match = input.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (match) {
        return { day: parseInt(match[1]), month: parseInt(match[2]) };
    }
    // 2. 15 sep
    match = input.match(/^(\d{1,2})\s+([a-záéíóú]+)/);
    if (match) {
        const day = parseInt(match[1]);
        const month = months[match[2]];
        if (month)
            return { day, month };
    }
    // 3. sep 15
    match = input.match(/^([a-záéíóú]+)\s+(\d{1,2})$/);
    if (match) {
        const month = months[match[1]];
        const day = parseInt(match[2]);
        if (month)
            return { day, month };
    }
    // 4. 15 de septiembre
    match = input.match(/^(\d{1,2})\s+de\s+([a-záéíóú]+)/);
    if (match) {
        const day = parseInt(match[1]);
        const month = months[match[2]];
        if (month)
            return { day, month };
    }
    return null;
}
export async function Birthday(ctx) {
    const args = ctx.args;
    const userId = ctx.msg.key.participant;
    if (!args.length) {
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: "🎂 Usa uno de estos formatos:\n• 15/08\n• 15 sep\n• sep 15\n• 15 de septiembre",
            reply: true
        });
        return;
    }
    const input = args.join(" ");
    const parsed = parseDate(input);
    if (!parsed) {
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: "❌ Formato inválido.\nEjemplos:\n15/08 | 15 sep | sep 15 | 15 de septiembre",
            reply: true
        });
        return;
    }
    const { day, month } = parsed;
    if (day < 1 || day > 31 || month < 1 || month > 12) {
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: "❌ Fecha no válida.",
            reply: true
        });
        return;
    }
    const user = await getMember(userId);
    if (!user) {
        Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: "❌ Usuario no registrado.",
            reply: true
        });
        return;
    }
    await UpdateBirthday(userId, { day, month });
    Bot.sendMessage({
        msg: ctx.msg,
        jid: ctx.jid,
        content: `🎉 ¡Cumpleaños guardado!\n📅 ${day}/${month}`,
        reply: true
    });
}
