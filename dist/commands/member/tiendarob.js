import { Bot } from "../../core/core.js";
import { getMember } from "../../db/mongodb.js";
import { AddBalance } from "../../db/mongodb.js";
import { addItem, hasItem } from "../../db/criminal.js";
import { robItems, getRobItem } from "../../assets/items.js";
async function handleShop(ctx) {
    const send = (content) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });
    const userId = ctx.msg.key.participant;
    const lines = [
        `🏴‍☠️ *TIENDA DE ROBOS*`,
        ``,
    ];
    for (const item of robItems) {
        lines.push(`• *${item.name}* - $${item.price.toLocaleString('en-US')}`);
        lines.push(`  ${item.description}`);
    }
    lines.push(``, `💡 Usa: !comprar <item>`);
    send(lines.join('\n'));
}
async function handleBuy(ctx) {
    const send = (content) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });
    const userId = ctx.msg.key.participant;
    const itemArg = ctx.args[0]?.toLowerCase();
    if (!itemArg) {
        return send("Uso: !comprar <item>");
    }
    const item = getRobItem(itemArg);
    if (!item) {
        const list = robItems.map(i => i.id).join(', ');
        return send(`❌ Item no encontrado. Disponibles: ${list}`);
    }
    const member = await getMember(userId);
    if (!member)
        return send("Usuario no encontrado.");
    const walletBalance = member.bank?.balance ?? 0;
    if (walletBalance < item.price) {
        return send(`❌ No tienes suficiente dinero. ${item.name} cuesta $${item.price.toLocaleString('en-US')} y tienes $${walletBalance.toLocaleString('en-US')}.`);
    }
    await AddBalance(userId, -item.price);
    await addItem(userId, item.id, 1);
    send(`✅ Compraste *${item.name}* por $${item.price.toLocaleString('en-US')}.\nUsa !inventario para ver tus items.`);
}
export { handleShop as ShopRob, handleBuy as BuyRob };
