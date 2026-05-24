import type { CommandContext } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getMember, AddBalance, GetCooldown, UpdateCooldown } from "../../db/mongodb.js";

// ─── Config ───────────────────────────────────────────────────────────────────

/** Ventana en la que el daily está disponible (hora local) */
const DAILY_OPEN = { h: 8, m: 0 }; // 8:00 am
const DAILY_CLOSE = { h: 21, m: 30 }; // 9:30 pm

/**
 * Calcula el timestamp en el que el daily vuelve a estar disponible:
 * las 8:00 AM del día siguiente (hora local del servidor).
 */
function getNextDailyOpen(): Date {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(DAILY_OPEN.h, DAILY_OPEN.m, 0, 0);
    return next;
}

/** Recompensa aleatoria entre $1 000 y $5 000 (en centenas) */
function getReward(): number {
    const steps = (5_000 - 1_000) / 100; // 40 posibles valores: 1000, 1100, ..., 5000
    return 1_000 + Math.floor(Math.random() * (steps + 1)) * 100;
}

// ─── Helper: ¿está abierta la ventana daily? ─────────────────────────────────

function isDailyOpen(): boolean {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const open = DAILY_OPEN.h * 60 + DAILY_OPEN.m;
    const close = DAILY_CLOSE.h * 60 + DAILY_CLOSE.m;
    return cur >= open && cur < close;
}

/** Devuelve el tiempo restante del cooldown en formato legible */
function formatCooldown(ms: number): string {
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// ─── Comando ──────────────────────────────────────────────────────────────────

export async function Daily(ctx: CommandContext) {
    const userId = ctx.msg.key.participant as string;
    const send = (content: string) =>
        Bot.sendMessage({ msg: ctx.msg, jid: ctx.jid, content, reply: true, delay: 2000 });

    try {
        // 1. Verificar que la ventana de cobro esté activa
        if (!isDailyOpen()) {
            return send(
                `⏰ El daily se puede cobrar entre las *8:00 am* y las *9:30 pm*.\n` +
                `¡Vuelve en ese horario!`
            );
        }

        // 2. Verificar usuario
        const user = await getMember(userId);
        if (!user) {
            return send("❌ Usuario no encontrado. Escribe algo en el grupo primero.");
        }

        // 3. Verificar cooldown personal (expira a las 8:00 AM del día siguiente)
        const cooldown = await GetCooldown(userId, "daily");
        if (cooldown && Date.now() < cooldown.getTime()) {
            const remaining = cooldown.getTime() - Date.now();
            return send(
                `⏳ Ya cobraste tu daily hoy.\n` +
                `Podrás volver a cobrar en *${formatCooldown(remaining)}*.`
            );
        }

        // 4. Entregar recompensa y actualizar cooldown hasta la próxima apertura
        const reward = getReward();
        const nextOpen = getNextDailyOpen();
        const cooldownMs = nextOpen.getTime() - Date.now();
        await AddBalance(userId, reward);
        await UpdateCooldown(userId, "daily", cooldownMs);

        return send(
            `✅ *¡Daily cobrado!*\n` +
            `💵 Recibiste: *$${reward.toLocaleString("en-US")}*\n` +
            `_Regresa mañana a partir de las *8:00 am* para cobrar de nuevo._`
        );

    } catch (err) {
        console.error("[Daily] Error:", err);
        return send("⚠️ Ocurrió un error al procesar tu daily. Intenta de nuevo.");
    }
}