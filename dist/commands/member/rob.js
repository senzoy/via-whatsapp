import { Bot } from "../../core/core.js";
import { getMember } from "../../db/mongodb.js";
import { getOrCreateCriminal, checkAndGetPenaltyStatus } from "../../db/criminal.js";
import { addPending, hasPending, scheduleSuccess, triggerPoliceCatch, isRecentlyRobbed } from "../../libs/robbery.js";
function isRobTime() {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    return totalMinutes >= 8 * 60 && totalMinutes < 21 * 60 + 30;
}
export async function Rob(ctx) {
    const send = (content) => Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });
    if (!isRobTime()) {
        return send("🌙 Los robos solo están permitidos entre las 8:00 AM y las 9:30 PM.");
    }
    const victimId = ctx.mentions[0];
    if (!victimId) {
        return send("Debes mencionar a un usuario. Usa: !rob @usuario");
    }
    const thiefId = ctx.msg.key.participant;
    const penalty = await checkAndGetPenaltyStatus(thiefId);
    if (penalty.blocked) {
        return send(penalty.message);
    }
    if (victimId === thiefId) {
        return send("No puedes robarte a ti mismo.");
    }
    if (isRecentlyRobbed(victimId)) {
        return send("Ese usuario fue robado recientemente. Tiene protección por 5 minutos.");
    }
    const [thief, victim] = await Promise.all([
        getMember(thiefId),
        getMember(victimId),
    ]);
    if (!thief || !victim) {
        return send("Usuario no encontrado.");
    }
    const criminal = await getOrCreateCriminal(thiefId);
    if (criminal.criminalPoints >= 8) {
        return send("🚫 Has acumulado demasiados puntos criminales (8+). No puedes robar.");
    }
    if (criminal.robCooldownUntil && Date.now() < new Date(criminal.robCooldownUntil).getTime()) {
        const remaining = Math.ceil((new Date(criminal.robCooldownUntil).getTime() - Date.now()) / 60000);
        return send(`⏳ Debes esperar ${remaining} minutos antes de volver a robar.`);
    }
    if (criminal.workPenaltyUntil && Date.now() < new Date(criminal.workPenaltyUntil).getTime()) {
        return send("⛔ Tienes una penalización laboral activa. No puedes robar.");
    }
    const victimWallet = victim.bank?.balance || 0;
    if (victimWallet <= 0) {
        return send("Ese usuario no tiene dinero en su wallet.");
    }
    if (hasPending(victimId)) {
        return send("Ese usuario ya está siendo robado por alguien más.");
    }
    const stealPercent = 0.04 + Math.random() * 0.06;
    const stealAmount = Math.max(1, Math.floor(victimWallet * stealPercent));
    const fine = 10000 + stealAmount;
    const pending = { thiefId, victimId, amount: stealAmount, fine, jid: ctx.jid, timeout: null };
    // 20% police catch
    if (Math.random() < 0.2) {
        triggerPoliceCatch(pending);
        return;
    }
    scheduleSuccess(pending);
    addPending(victimId, pending);
    Bot.sendMessage({
        msg: ctx.msg,
        jid: ctx.jid,
        content: `🔔 @${victimId.split('@')[0]} alguien está intentando robarte!\n\nResponde con *"atrapado"*, *"rata"* o *"ladron"* para atrapar al ladrón.\n\nTienes 1 hora para responder.`,
        mentions: [victimId],
        delay: 1000,
    });
}
