import { getNextOpenTime, isCasinoOpen } from "../../libs/types.js";
import { Bot } from "../../core/core.js";
import { getMember, AddBalance, GetCooldown, UpdateCooldown, AddCasinoResult } from "../../db/mongodb.js";
// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────
const MIN_BET = 10_000;
const MAX_BET = 20_000_000;
const COOLDOWN_WIN = 15_000;
const COOLDOWN_LOSE = 8_000;
const TARGET_RTP = 0.92;
// Protección
const MAX_PAYOUT = 10_000_000;
const HOUSE_RESERVE = 5_000_000;
// ─────────────────────────────────────────────────────────────
// ESTADÍSTICAS GLOBALES
// ─────────────────────────────────────────────────────────────
let globalIn = 0;
let globalOut = 0;
function getGlobalRTP() {
    if (globalIn <= 0) {
        return 0;
    }
    return globalOut / globalIn;
}
// ─────────────────────────────────────────────────────────────
// RULETA EUROPEA
// ─────────────────────────────────────────────────────────────
const RED_NUMBERS = new Set([
    1, 3, 5, 7, 9,
    12, 14, 16, 18,
    19, 21, 23, 25,
    27, 30, 32, 34, 36
]);
const COLOR_EMOJI = {
    rojo: "🔴",
    negro: "⚫",
    verde: "🟢"
};
// ─────────────────────────────────────────────────────────────
// RANDOM CRIPTOGRÁFICO
// ─────────────────────────────────────────────────────────────
function secureRandom() {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 0x1_0000_0000;
}
function secureRandInt(max) {
    const limit = 0x1_0000_0000 - (0x1_0000_0000 % max);
    const buf = new Uint32Array(1);
    let val;
    do {
        crypto.getRandomValues(buf);
        val = buf[0];
    } while (val >= limit);
    return val % max;
}
// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function getColor(n) {
    if (n === 0) {
        return "verde";
    }
    return RED_NUMBERS.has(n)
        ? "rojo"
        : "negro";
}
// ─────────────────────────────────────────────────────────────
// PARSE DE APUESTAS
// ─────────────────────────────────────────────────────────────
function parseBet(raw) {
    const bet = raw.toLowerCase().trim();
    // ─────────────────────────────
    // NÚMERO EXACTO
    // ─────────────────────────────
    const asNum = Number(bet);
    if (bet === "verde" ||
        (!isNaN(asNum) &&
            Number.isInteger(asNum) &&
            asNum >= 0 &&
            asNum <= 36)) {
        const target = bet === "verde"
            ? 0
            : asNum;
        return {
            type: "number",
            multiplier: 35,
            wins: (n) => n === target
        };
    }
    // ─────────────────────────────
    // COLOR
    // ─────────────────────────────
    if (bet === "rojo") {
        return {
            type: "color",
            multiplier: 1,
            wins: (n) => getColor(n) === "rojo"
        };
    }
    if (bet === "negro") {
        return {
            type: "color",
            multiplier: 1,
            wins: (n) => getColor(n) === "negro"
        };
    }
    // ─────────────────────────────
    // PARIDAD
    // ─────────────────────────────
    if (bet === "par") {
        return {
            type: "parity",
            multiplier: 1,
            wins: (n) => n !== 0 && n % 2 === 0
        };
    }
    if (bet === "impar") {
        return {
            type: "parity",
            multiplier: 1,
            wins: (n) => n !== 0 && n % 2 !== 0
        };
    }
    // ─────────────────────────────
    // MITADES
    // ─────────────────────────────
    if (bet === "bajo" || bet === "1-18") {
        return {
            type: "half",
            multiplier: 1,
            wins: (n) => n >= 1 && n <= 18
        };
    }
    if (bet === "alto" || bet === "19-36") {
        return {
            type: "half",
            multiplier: 1,
            wins: (n) => n >= 19 && n <= 36
        };
    }
    // ─────────────────────────────
    // DOCENAS
    // ─────────────────────────────
    const dozenMap = {
        "1d": 1,
        "2d": 2,
        "3d": 3,
        "docena1": 1,
        "docena2": 2,
        "docena3": 3
    };
    if (bet in dozenMap) {
        const target = dozenMap[bet];
        return {
            type: "dozen",
            multiplier: 2,
            wins: (n) => n !== 0 &&
                (n <= 12
                    ? 1
                    : n <= 24
                        ? 2
                        : 3) === target
        };
    }
    // ─────────────────────────────
    // COLUMNAS
    // ─────────────────────────────
    const colMap = {
        "col1": 1,
        "col2": 2,
        "col3": 3,
        "columna1": 1,
        "columna2": 2,
        "columna3": 3
    };
    if (bet in colMap) {
        const target = colMap[bet];
        return {
            type: "column",
            multiplier: 2,
            wins: (n) => n !== 0 &&
                (n % 3 === 1
                    ? 1
                    : n % 3 === 2
                        ? 2
                        : 3) === target
        };
    }
    return null;
}
// ─────────────────────────────────────────────────────────────
// RULETA REAL
// ─────────────────────────────────────────────────────────────
function spinRoulette() {
    return secureRandInt(37);
}
// ─────────────────────────────────────────────────────────────
// AJUSTE DINÁMICO DE PAYOUT
// ─────────────────────────────────────────────────────────────
function getDynamicMultiplier(baseMultiplier) {
    const rtp = getGlobalRTP();
    // Casino está pagando demasiado
    if (rtp > TARGET_RTP + 0.03) {
        if (baseMultiplier >= 35) {
            return 30;
        }
        if (baseMultiplier >= 2) {
            return 1.8;
        }
        return 0.9;
    }
    // Casino está ganando demasiado
    if (rtp < TARGET_RTP - 0.05) {
        if (baseMultiplier >= 35) {
            return 36;
        }
        if (baseMultiplier >= 2) {
            return 2.2;
        }
        return 1;
    }
    return baseMultiplier;
}
// ─────────────────────────────────────────────────────────────
// AYUDA
// ─────────────────────────────────────────────────────────────
const BET_HELP = `*Opciones disponibles:*\n` +
    `• rojo / negro\n` +
    `• par / impar\n` +
    `• bajo / alto\n` +
    `• 1d / 2d / 3d\n` +
    `• col1 / col2 / col3\n` +
    `• 0-36 o verde`;
// ─────────────────────────────────────────────────────────────
// COMANDO PRINCIPAL
// ─────────────────────────────────────────────────────────────
export async function Ruleta(ctx) {
    if (!isCasinoOpen()) {
        return Bot.sendMessage({
            msg: ctx.msg,
            jid: ctx.jid,
            content: `🎰 Casino cerrado.\n` +
                `Abre en: ${getNextOpenTime()}`,
            reply: true
        });
    }
    const userId = ctx.msg.key.participant;
    const send = (content) => Bot.sendMessage({
        msg: ctx.msg,
        jid: ctx.jid,
        content,
        reply: true,
        delay: 1000
    });
    try {
        // ─────────────────────────────
        // COOLDOWN
        // ─────────────────────────────
        const cooldown = await GetCooldown(userId, "casino");
        if (cooldown &&
            Date.now() < cooldown.getTime()) {
            return send("⏳ Espera a que la bola deje de girar...");
        }
        // ─────────────────────────────
        // VALIDACIÓN
        // ─────────────────────────────
        const amount = parseInt(ctx.args[0]);
        const rawBet = ctx.args[1];
        if (isNaN(amount) ||
            amount < MIN_BET ||
            amount > MAX_BET) {
            return send(`❌ Apuesta mínima: $${MIN_BET.toLocaleString()}\n` +
                `❌ Apuesta máxima: $${MAX_BET.toLocaleString()}`);
        }
        if (!rawBet) {
            return send(`⚠️ Debes indicar una apuesta.\n\n${BET_HELP}`);
        }
        // ─────────────────────────────
        // PARSE
        // ─────────────────────────────
        const bet = parseBet(rawBet);
        if (!bet) {
            return send(`❌ Apuesta inválida: ${rawBet}\n\n${BET_HELP}`);
        }
        // ─────────────────────────────
        // USUARIO
        // ─────────────────────────────
        const user = await getMember(userId);
        const balance = user?.bank?.balance ?? 0;
        if (balance < amount) {
            return send(`💸 Saldo insuficiente.\n` +
                `Tienes: $${balance.toLocaleString()}`);
        }
        // ─────────────────────────────
        // PROTECCIÓN DEL CASINO
        // ─────────────────────────────
        const casinoProfit = globalIn - globalOut;
        if (casinoProfit < -HOUSE_RESERVE) {
            return send("🏦 El casino está ajustando liquidez.\n" +
                "Intenta más tarde.");
        }
        // ─────────────────────────────
        // COBRAR APUESTA
        // ─────────────────────────────
        await AddBalance(userId, -amount);
        globalIn += amount;
        // ─────────────────────────────
        // GIRO REAL
        // ─────────────────────────────
        const number = spinRoulette();
        const color = getColor(number);
        const won = bet.wins(number);
        // ─────────────────────────────
        // RESULTADO
        // ─────────────────────────────
        let finalMsg = "";
        if (won) {
            const adjustedMultiplier = getDynamicMultiplier(bet.multiplier);
            const payout = Math.min(MAX_PAYOUT, Math.floor(amount +
                amount * adjustedMultiplier));
            await AddBalance(userId, payout);
            globalOut += payout;
            await AddCasinoResult(userId, "roulette", amount, payout);
            await UpdateCooldown(userId, "casino", COOLDOWN_WIN);
            finalMsg =
                `🎉 *¡GANASTE!* 🎉\n` +
                    `🎯 Cayó: *${number}* ${COLOR_EMOJI[color]}\n` +
                    `💰 Premio: *$${payout.toLocaleString()}*`;
        }
        else {
            await AddCasinoResult(userId, "roulette", amount, 0);
            await UpdateCooldown(userId, "casino", COOLDOWN_LOSE);
            finalMsg =
                `💀 *PERDISTE* 💀\n` +
                    `🎯 Cayó: *${number}* ${COLOR_EMOJI[color]}\n` +
                    `💸 Perdiste: *$${amount.toLocaleString()}*`;
        }
        // ─────────────────────────────
        // INFO EXTRA
        // ─────────────────────────────
        const rtp = (getGlobalRTP() * 100).toFixed(2);
        finalMsg +=
            `\n\n📊 RTP Casino: ${rtp}%`;
        return send(finalMsg);
    }
    catch (err) {
        console.error("[Ruleta]", err);
        return send("⚠️ Hubo un error en la ruleta.");
    }
}
